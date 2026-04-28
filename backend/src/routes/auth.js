import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  sendOtpSMS,
  sendWelcomeSMS,
  verifyOtp as verifyOtpVia2Factor,
} from "../services/twoFactorService.js";
import {
  sendOtpEmail,
  sendWelcomeEmail,
  verifyEmailTransporter,
} from "../services/emailService.js";

const router = express.Router();
const otpStore = new Map();
const OTP_EXPIRY_MINUTES = 10;

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

const createSession = (identifier, channel, otp) => {
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  otpStore.set(identifier, { otp: String(otp), expiresAt, channel });
};

const verifyStoredOtp = (identifier, otp, expectedChannel) => {
  const stored = otpStore.get(identifier);
  if (!stored) {
    return { valid: false, reason: "OTP not found or expired. Please request a new OTP." };
  }

  if (expectedChannel && stored.channel !== expectedChannel) {
    return { valid: false, reason: "OTP type mismatch. Please request a new OTP." };
  }

  if (isOtpExpired(stored.expiresAt)) {
    otpStore.delete(identifier);
    return { valid: false, reason: "OTP has expired. Please request a new OTP." };
  }

  if (String(stored.otp) !== String(otp)) {
    return { valid: false, reason: "Invalid OTP. Please try again." };
  }

  otpStore.delete(identifier);
  return { valid: true };
};

router.get("/email-status", async (_req, res) => {
  try {
    const isValid = await verifyEmailTransporter();
    const emailUser = process.env.EMAIL_USER || "NOT SET";

    res.json({
      status: isValid ? "Working" : "Failed",
      email: emailUser,
      emailPassConfigured: Boolean(process.env.EMAIL_PASS),
      details: {
        emailUser,
        message: isValid
          ? "Email service is ready to send OTPs"
          : "Email service is not configured properly. Check EMAIL_USER and EMAIL_PASS in .env",
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

router.post("/send-otp", async (req, res) => {
  const { identifier } = req.body;
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return res.status(400).json({ message: "Email or mobile number is required" });
  }

  const otp = generateOtp();
  const isEmail = normalizedIdentifier.includes("@");

  try {
    if (isEmail) {
      await sendOtpEmail(normalizedIdentifier, otp);
      createSession(normalizedIdentifier, "email", otp);
      return res.json({ message: "OTP sent to email successfully" });
    }

    await sendOtpSMS(normalizedIdentifier, otp);
    createSession(normalizedIdentifier, "sms", otp);
    return res.json({ message: "OTP sent to mobile successfully" });
  } catch (err) {
    return res.status(500).json({
      message: `Failed to send OTP. ${err?.message || "Please try again."}`,
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { identifier, otp } = req.body;
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier || !otp) {
    return res.status(400).json({ message: "Email/mobile and OTP are required" });
  }

  const isEmail = normalizedIdentifier.includes("@");

  if (isEmail) {
    const emailCheck = verifyStoredOtp(normalizedIdentifier, otp, "email");
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.reason });
    }
  } else {
    let smsVerified = false;
    let verificationError = null;

    try {
      const verifyResult = await verifyOtpVia2Factor(normalizedIdentifier, otp);
      smsVerified = Boolean(verifyResult?.matched);
    } catch (err) {
      verificationError = err;
    }

    if (!smsVerified) {
      const localFallback = verifyStoredOtp(normalizedIdentifier, otp, "sms");
      if (!localFallback.valid) {
        return res.status(400).json({
          message:
            verificationError?.message && !verificationError.message.toLowerCase().includes("otp")
              ? `OTP verification failed: ${verificationError.message}`
              : localFallback.reason,
        });
      }
    } else {
      otpStore.delete(normalizedIdentifier);
    }
  }

  let user = await User.findOne(
    isEmail ? { email: normalizedIdentifier } : { mobile: normalizedIdentifier },
  );

  const isNewUser = !user;

  if (!user) {
    user = new User(
      isEmail ? { email: normalizedIdentifier } : { mobile: normalizedIdentifier },
    );
    await user.save();

    try {
      if (isEmail) {
        await sendWelcomeEmail(normalizedIdentifier, user.name || "Guest");
      } else {
        await sendWelcomeSMS(normalizedIdentifier, user.name || "Guest");
      }
    } catch (_notificationErr) {
      // Welcome notification should not block login.
    }
  }

  const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return res.json({
    message: "Login successful",
    token,
    user,
    isNewUser,
  });
});

router.post("/password", async (req, res) => {
  const { email, mobile, password } = req.body;
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  const normalizedMobile = mobile ? normalizePhoneIdentifier(mobile) : null;

  let user = await User.findOne(normalizedEmail ? { email: normalizedEmail } : { mobile: normalizedMobile });

  if (user) {
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.json({ message: "Login successful", token, user });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user = new User({ email: normalizedEmail, mobile: normalizedMobile, password: hashedPassword });
  await user.save();

  try {
    if (normalizedEmail) {
      await sendWelcomeEmail(normalizedEmail, user.name || "Guest");
    } else if (normalizedMobile) {
      await sendWelcomeSMS(normalizedMobile, user.name || "Guest");
    }
  } catch (_notificationErr) {
    // Welcome notification should not block registration.
  }

  const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return res.json({ message: "Registered successfully", token, user });
});

export default router;
