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
import {
  getSmsOtpStatus,
  requestSmsOtp,
  verifySmsOtp,
} from "../services/smsFallbackService.js";
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

const createSmsSession = (identifier, verificationId) => {
  otpStore.set(identifier, {
    channel: "sms",
    otp: null,
    verificationId: String(verificationId),
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0,
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

const maskPhone = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .replace(/(\d{2})\d+(\d{2})$/, "$1******$2");

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

router.get("/sms-status", (_req, res) => {
  try {
    const status = getSmsOtpStatus();
    res.json({
      status: status.configured ? "Configured" : "Not Configured",
      provider: status.provider,
      apiUrl: status.apiUrl,
      customerIdConfigured: status.customerIdConfigured,
      keyConfigured: status.keyConfigured,
      details: {
        message: status.configured
          ? "SMS OTP is configured through Message Central VerifyNow"
          : "Set MESSAGE_CENTRAL_CUSTOMER_ID and MESSAGE_CENTRAL_KEY for SMS OTP.",
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "Error",
      error: err.message,
      message: "Failed to check SMS status",
    });
  }
});

router.get("/test-otp-system", async (_req, res) => {
  const smsStatus = getSmsOtpStatus();
  let emailStatus = false;

  try {
    emailStatus = await verifyEmailTransporter();
  } catch (_err) {
    emailStatus = false;
  }

  res.json({
    status:
      mongoose.connection.readyState === 1 && (emailStatus || smsStatus.configured)
        ? "healthy"
        : "issues detected",
    services: {
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      email: emailStatus ? "working" : "failed",
      sms: smsStatus.configured ? "configured" : "not configured",
      smsProvider: smsStatus.provider,
    },
    recommendation:
      emailStatus && smsStatus.configured
        ? "System ready for email and SMS OTP"
        : "Configure Hostinger email and Message Central credentials.",
  });
});

router.post("/send-otp", async (req, res) => {
  const { identifier, debug } = req.body;
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return res.status(400).json({ message: "Email or mobile number is required" });
  }

  const isEmail = normalizedIdentifier.includes("@");

  try {
    if (isEmail) {
      const otp = generateOtp();
      await sendOtpEmail(normalizedIdentifier, otp);
      createEmailSession(normalizedIdentifier, otp);

      return res.json({
        message: "OTP sent to email successfully",
        channel: "email",
      });
    }

    const smsStatus = getSmsOtpStatus();
    if (!smsStatus.configured) {
      return res.status(503).json({
        message: "SMS OTP is not configured. Please use email login or try again later.",
        channel: "sms",
        provider: "messagecentral",
      });
    }

    const smsResponse = await requestSmsOtp(normalizedIdentifier, 6);
    createSmsSession(normalizedIdentifier, smsResponse.verificationId);

    return res.json({
      message: "OTP sent to mobile successfully",
      channel: "sms",
      provider: "messagecentral",
      verificationId: smsResponse.verificationId,
      requestId: smsResponse.verificationId,
      maskedPhone: maskPhone(normalizedIdentifier),
    });
  } catch (err) {
    return res.status(500).json({
      message: isEmail
        ? "Failed to send email OTP. Please try again later."
        : "Failed to send SMS OTP. Please try again later.",
      error: debug || process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { identifier, otp, verificationId, requestId, code } = req.body;
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return res.status(400).json({ message: "Email/mobile is required" });
  }

  const isEmail = normalizedIdentifier.includes("@");

  if (isEmail) {
    if (!/^\d{6}$/.test(String(otp || "").trim())) {
      return res.status(400).json({ message: "OTP must be 6 digits" });
    }

    const otpCheck = verifyEmailOtp(normalizedIdentifier, otp);
    if (!otpCheck.valid) {
      return res.status(400).json({ message: otpCheck.message });
    }
  } else {
    const stored = otpStore.get(normalizedIdentifier);
    const providerVerificationId =
      verificationId || requestId || stored?.verificationId || null;
    const providerCode = code || otp;

    if (!stored || stored.channel !== "sms") {
      return res.status(400).json({ message: "No active SMS session. Please request a new OTP." });
    }

    if (isOtpExpired(stored.expiresAt)) {
      otpStore.delete(normalizedIdentifier);
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    if (!providerVerificationId || !/^\d{6}$/.test(String(providerCode || "").trim())) {
      return res.status(400).json({ message: "Verification ID and 6-digit OTP are required" });
    }

    try {
      await verifySmsOtp(providerVerificationId, providerCode, normalizedIdentifier);
      otpStore.delete(normalizedIdentifier);
    } catch (err) {
      return res.status(400).json({
        message: "Invalid OTP. Please try again.",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
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
  }

  try {
    if (isNewUser && user.email) {
      await sendWelcomeEmail(user.email, user.name || "Guest");
    }
  } catch (notificationErr) {
    console.warn("Welcome email failed:", notificationErr.message);
  }

  const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return res.json({
    message: "Login successful",
    token,
    user: sanitizeUser(user),
    isNewUser,
  });
});

router.post("/password", async (req, res) => {
  const { email, mobile, password } = req.body;
  const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
  const normalizedMobile = mobile ? normalizePhoneIdentifier(mobile) : null;

  if ((!normalizedEmail && !normalizedMobile) || !password) {
    return res.status(400).json({ message: "Email/mobile and password are required" });
  }

  let user = await User.findOne(
    normalizedEmail ? { email: normalizedEmail } : { mobile: normalizedMobile },
  );

  if (user) {
    const valid = await bcrypt.compare(password, user.password || "");
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.json({ message: "Login successful", token, user: sanitizeUser(user) });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user = new User({
    email: normalizedEmail,
    mobile: normalizedMobile,
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

  const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return res.json({ message: "Registered successfully", token, user: sanitizeUser(user) });
});

export default router;
