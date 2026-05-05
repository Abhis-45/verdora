import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import {
  sendWelcomeEmail,
  verifyEmailTransporter,
} from "../services/emailService.js";
import {
  sendOtp,
  sendOtpViaEmail,
  verifyOtp,
  resendOtp,
  isEmailIdentifier,
  normalizePhoneForUser,
} from "../services/otpService.js";
import { sanitizeUser } from "../utils/validators.js";

const router = express.Router();

const createJwtToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ id: userId, role: "user" }, secret, {
    expiresIn: "1d",
  });
};

const getMobileVariants = (identifier) => {
  const normalized = normalizePhoneForUser(identifier);
  const withoutPlus = normalized.replace(/^\+/, "");
  const raw = String(identifier || "").trim();
  return [...new Set([normalized, withoutPlus, raw].filter(Boolean))];
};

const findOrCreateOtpUser = async (identifier) => {
  const normalizedIdentifier = String(identifier || "").trim();

  if (isEmailIdentifier(normalizedIdentifier)) {
    const normalizedEmail = normalizedIdentifier.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });
    const isNewUser = !user;

    if (!user) {
      user = new User({ email: normalizedEmail });
      await user.save();
    }

    return { user, isNewUser, channel: "email" };
  }

  const normalizedMobile = normalizePhoneForUser(normalizedIdentifier);
  let user = await User.findOne({
    mobile: { $in: getMobileVariants(normalizedIdentifier) },
  });
  const isNewUser = !user;

  if (!user) {
    user = new User({ mobile: normalizedMobile });
    await user.save();
  } else if (!user.mobile && normalizedMobile) {
    user.mobile = normalizedMobile;
    await user.save();
  }

  return { user, isNewUser, channel: "sms" };
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
          : "Email service is not configured. Check EMAIL_USER and EMAIL_PASS in .env",
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

router.post("/resend-otp", async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: "Email or phone number is required" });
  }

  try {
    const result = await resendOtp(identifier);

    if (!result.success) {
      return res.status(400).json({ message: result.error || "Failed to resend OTP" });
    }

    return res.json({
      success: true,
      message: result.message,
      provider: result.provider,
      verificationId: result.verificationId,
      identifier: result.identifier,
    });
  } catch (err) {
    console.error("Failed to resend OTP:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to resend OTP. Please try again later.",
      error: err.message,
    });
  }
});

router.post("/send-otp", async (req, res) => {
  const { identifier } = req.body;

  if (!identifier) {
    return res.status(400).json({ message: "Email or phone number is required" });
  }

  try {
    const result = await sendOtp(identifier);

    if (!result.success) {
      return res.status(400).json({ message: result.error || "Failed to send OTP" });
    }

    return res.json({
      success: true,
      message: result.message,
      provider: result.provider,
      verificationId: result.verificationId,
      identifier: result.identifier,
    });
  } catch (err) {
    console.error("Failed to send OTP:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again later.",
      error: err.message,
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { identifier, otp, verificationId } = req.body;

  if (!identifier || !otp) {
    return res.status(400).json({ message: "Email/phone and OTP are required" });
  }

  if (!/^\d{6}$/.test(String(otp || "").trim())) {
    return res.status(400).json({ message: "OTP must be 6 digits" });
  }

  try {
    const otpCheck = await verifyOtp(identifier, otp, verificationId);

    if (!otpCheck.valid) {
      return res.status(400).json({ message: otpCheck.message });
    }

    const { user, isNewUser, channel } = await findOrCreateOtpUser(identifier);

    try {
      if (isNewUser && user.email) {
        await sendWelcomeEmail(user.email, user.name || "Guest");
      }
    } catch (notificationErr) {
      console.warn("Welcome email failed:", notificationErr.message);
    }

    const token = createJwtToken(user._id);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user),
      isNewUser,
      provider: channel,
    });
  } catch (err) {
    console.error("Failed to verify OTP:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again later.",
      error: err.message,
    });
  }
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

// ✅ FORGOT PASSWORD - REQUEST OTP
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        message: "If this email exists, you'll receive a password reset link",
        maskedEmail: normalizedEmail.replace(/(.{2})(.*)(.{2})/, "$1***$3"),
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const result = await sendOtpViaEmail(normalizedEmail, otp);

    if (!result.success) {
      return res.status(500).json({ message: "Failed to send reset email" });
    }

    return res.json({
      success: true,
      message: "Password reset OTP sent to your email",
      maskedEmail: normalizedEmail.replace(/(.{2})(.*)(.{2})/, "$1***$3"),
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({
      message: "Failed to process password reset request",
      error: err.message,
    });
  }
});

// ✅ PASSWORD RESET - VERIFY OTP
router.post("/verify-reset-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();

    // Verify OTP using otpService
    const { verifyEmailOtp } = await import("../services/otpService.js");
    const otpCheck = verifyEmailOtp(normalizedEmail, otp);

    if (!otpCheck.valid) {
      return res.status(400).json({ message: otpCheck.message });
    }

    // Create reset token
    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({
      success: true,
      message: "OTP verified successfully",
      resetToken,
      email: normalizedEmail,
    });
  } catch (err) {
    console.error("Verify reset OTP error:", err);
    return res.status(500).json({
      message: "Failed to verify OTP",
      error: err.message,
    });
  }
});

// ✅ PASSWORD RESET - SET NEW PASSWORD
router.post("/reset-password", async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  if (!resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  try {
    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (tokenErr) {
      return res.status(400).json({ message: "Reset link has expired. Please try again." });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ message: "Invalid reset link" });
    }

    // Find user
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully! You can now login with your new password.",
    });
  } catch (err) {
    console.error("Password reset error:", err);
    return res.status(500).json({
      message: "Failed to reset password",
      error: err.message,
    });
  }
});

export default router;
