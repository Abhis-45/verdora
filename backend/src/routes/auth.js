import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";
import User from "../models/User.js";
import {
  sendWelcomeSMS,
  sendTransactionalOtpSms,
  verifyOtpVia2Factor,
} from "../services/enhancedTwoFactorService.js";
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

router.get("/sms-status", async (_req, res) => {
  try {
    const apiKey = process.env.TWO_FACTOR_API_KEY || "NOT SET";
    const senderId = process.env.TWO_FACTOR_SENDER_ID || "VERDOR";
    const isConfigured = Boolean(process.env.TWO_FACTOR_API_KEY);

    res.json({
      status: isConfigured ? "Configured" : "Not Configured",
      apiKeyConfigured: isConfigured,
      senderId: senderId,
      apiEndpoint: "https://2factor.in/API/R1/SEND",
      details: {
        message: isConfigured
          ? "SMS service is ready to send OTPs"
          : "SMS service is not configured. Set TWO_FACTOR_API_KEY in .env",
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

// Test endpoint to diagnose 2Factor API issues
router.get("/test-sms/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const apiKey = process.env.TWO_FACTOR_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: "API key not configured" });
    }

    const testOtp = "123456";
    const testMessage = `Test OTP: ${testOtp}`;
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    console.log(`\n🧪 Testing 2Factor API`);
    console.log(`Phone: ${formattedPhone}`);
    console.log(`Endpoint: https://2factor.in/API/R1/SEND`);
    console.log(`Message: ${testMessage}`);

    const response = await axios.get("https://2factor.in/API/R1/SEND", {
      params: {
        apikey: apiKey,
        to: formattedPhone,
        msg: testMessage,
      },
      timeout: 10000,
    });

    res.json({
      success: true,
      status: response.status,
      apiResponse: response.data,
      diagnostics: {
        phone: formattedPhone,
        message: testMessage,
        endpoint: "https://2factor.in/API/R1/SEND",
      },
    });
  } catch (err) {
    console.error(`\n❌ 2Factor API Test Failed`);
    console.error(`Error: ${err.message}`);
    console.error(`Response Status: ${err.response?.status}`);
    console.error(`Response Data:`, err.response?.data);

    res.status(500).json({
      success: false,
      error: err.message,
      responseStatus: err.response?.status,
      responseData: err.response?.data,
      diagnostics: err.response?.data,
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
    console.log(`\n🔄 [OTP Request] Processing for: ${isEmail ? "EMAIL" : "SMS"}`);
    console.log(`📞 Normalized identifier: ${normalizedIdentifier}`);

    if (isEmail) {
      console.log(`📧 Attempting to send OTP via email...`);
      await sendOtpEmail(normalizedIdentifier, otp);
      createSession(normalizedIdentifier, "email", otp);
      console.info(`✅ OTP email sent to ${normalizedIdentifier}`);
      return res.json({ message: "OTP sent to email successfully" });
    }

    // For SMS: Try to send via 2Factor API, fallback to local verification
    console.log(`📲 Attempting to send OTP via SMS...`);
    let smsSent = false;
    let smsError = null;

    try {
      await sendTransactionalOtpSms(normalizedIdentifier, otp);
      smsSent = true;
      console.info(`✅ OTP SMS sent to ${normalizedIdentifier}`);
    } catch (err) {
      smsError = err.message;
      console.warn(`⚠️ SMS failed: ${err.message}, will use local OTP verification`);
      smsSent = false;
    }

    // Store OTP locally regardless of SMS success for verification
    createSession(normalizedIdentifier, "sms", otp);
    
    if (smsSent) {
      return res.json({ message: "OTP sent to mobile successfully" });
    } else {
      // SMS failed but OTP is stored locally
      console.warn(`⚠️ SMS delivery issue but OTP stored for verification`);
      return res.json({ 
        message: "OTP ready for verification (SMS delivery pending)",
        note: "OTP has been generated. Please try again if SMS doesn't arrive shortly."
      });
    }
  } catch (err) {
    console.error(`\n❌ [OTP Error] Failed for identifier: ${normalizedIdentifier}`);
    console.error(`Error message: ${err?.message}`);
    console.error(`Full error:`, err);
    
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
