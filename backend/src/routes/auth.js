import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import {
  sendOtpEmail,
  sendWelcomeEmail,
  verifyEmailTransporter,
} from "../services/emailService.js";
import { sanitizeUser } from "../utils/validators.js";

const router = express.Router();
const otpStore = new Map();
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const normalizePhoneIdentifier = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;

  return String(value || "").trim();
};

const normalizeIdentifier = (identifier) => {
  const raw = String(identifier || "").trim();
  if (!raw) return raw;
  return raw.includes("@") ? raw.toLowerCase() : normalizePhoneIdentifier(raw);
};

const isOtpExpired = (expiresAt) => Date.now() > Number(expiresAt || 0);

const createEmailSession = (identifier, otp) => {
  otpStore.set(identifier, {
    channel: "email",
    otp: String(otp),
    verificationId: null,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0,
  });
};

const createJwtToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ id: userId, role: "user" }, secret, {
    expiresIn: "1d",
  });
};



const verifyEmailOtp = (identifier, otp) => {
  const stored = otpStore.get(identifier);

  if (!stored || stored.channel !== "email") {
    return { valid: false, message: "OTP not found or expired. Please request a new OTP." };
  }

  if (stored.attempts >= OTP_MAX_ATTEMPTS) {
    otpStore.delete(identifier);
    return { valid: false, message: "Too many failed attempts. Please request a new OTP." };
  }

  if (isOtpExpired(stored.expiresAt)) {
    otpStore.delete(identifier);
    return { valid: false, message: "OTP has expired. Please request a new OTP." };
  }

  stored.attempts += 1;

  if (String(stored.otp).trim() !== String(otp || "").trim()) {
    return { valid: false, message: "Invalid OTP. Please try again." };
  }

  otpStore.delete(identifier);
  return { valid: true };
};



router.get("/email-status", async (_req, res) => {
  try {
    const isValid = await verifyEmailTransporter();
    const emailUser = process.env.EMAIL_USER || "support@verdora.in";

    res.json({
      status: isValid ? "Working" : "Failed",
      provider: "hostinger-smtp",
      email: emailUser,
      from: process.env.EMAIL_FROM || "support@verdora.in",
      emailPassConfigured: Boolean(process.env.EMAIL_PASS),
      details: {
        message: isValid
          ? "Hostinger email service is ready to send OTPs and notifications"
          : "Email service is not configured. Check EMAIL_USER, EMAIL_PASS, EMAIL_HOST and EMAIL_FROM.",
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      error: err.message,
      message: "Failed to check email status",
    });
  }
});



router.get("/test-email-send", async (req, res) => {
  try {
    const testEmail = req.query.email || "test@example.com";
    const testOtp = "123456";

    console.log("Testing email send to:", testEmail);
    await sendOtpEmail(testEmail, testOtp);

    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Test email failed:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.post("/send-otp", async (req, res) => {
  const { identifier, debug } = req.body;
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Only email login allowed
  if (!normalizedIdentifier.includes("@")) {
    return res.status(400).json({ message: "Please use email for login" });
  }

  try {
    console.log("Sending OTP to:", normalizedIdentifier, "Environment:", process.env.NODE_ENV);

    const otp = generateOtp();
    console.log("Generated OTP:", otp);

    await sendOtpEmail(normalizedIdentifier, otp);
    createEmailSession(normalizedIdentifier, otp);

    console.log("OTP sent successfully to:", normalizedIdentifier);
    return res.json({
      message: "OTP sent to email successfully",
      channel: "email",
    });
  } catch (err) {
    console.error("Failed to send OTP email:", {
      error: err.message,
      stack: err.stack,
      email: normalizedIdentifier,
      env: process.env.NODE_ENV,
    });

    return res.status(500).json({
      message: "Failed to send email OTP. Please try again later.",
      error: debug || process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { identifier, otp } = req.body;
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!normalizedIdentifier.includes("@")) {
    return res.status(400).json({ message: "Please use email for login" });
  }

  if (!/^\d{6}$/.test(String(otp || "").trim())) {
    return res.status(400).json({ message: "OTP must be 6 digits" });
  }

  const otpCheck = verifyEmailOtp(normalizedIdentifier, otp);
  if (!otpCheck.valid) {
    return res.status(400).json({ message: otpCheck.message });
  }

  let user = await User.findOne({
    email: normalizedIdentifier,
  });

  const isNewUser = !user;

  if (!user) {
    user = new User({
      email: normalizedIdentifier,
    });
    await user.save();
  }

  try {
    if (isNewUser && user.email) {
      await sendWelcomeEmail(user.email, user.name || "Guest");
    }
  } catch (notificationErr) {
    console.warn("Welcome email failed:", notificationErr.message);
  }

  const token = createJwtToken(user._id);

  return res.json({
    message: "Login successful",
    token,
    user: sanitizeUser(user),
    isNewUser,
  });
});

router.post("/password", async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  let user = await User.findOne({
    email: normalizedEmail,
  });

  if (user) {
    const valid = await bcrypt.compare(password, user.password || "");
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = createJwtToken(user._id);
    return res.json({ message: "Login successful", token, user: sanitizeUser(user) });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user = new User({
    email: normalizedEmail,
    password: hashedPassword,
  });
  await user.save();

  try {
    if (user.email) {
      await sendWelcomeEmail(user.email, user.name || "Guest");
    }
  } catch (notificationErr) {
    console.warn("Welcome email failed:", notificationErr.message);
  }

  const token = createJwtToken(user._id);

  return res.json({ message: "Registered successfully", token, user: sanitizeUser(user) });
});

export default router;
