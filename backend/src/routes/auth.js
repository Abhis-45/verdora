import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  sendOtpSMS as sendOtpSMSVia2FA,
  verifyOtp as verifyOtpVia2Factor,
} from "../services/enhancedTwoFactorService.js";
import {
  sendOtpEmail,
  sendWelcomeEmail,
  verifyEmailTransporter,
} from "../services/emailService.js";

const router = express.Router();
// Email OTP store retained for email flow only (no SMS local OTP storage)
const emailOtpStore = new Map();
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
  emailOtpStore.set(identifier, { otp: String(otp), expiresAt, channel });
};

const verifyStoredOtp = (identifier, otp, expectedChannel) => {
  const stored = emailOtpStore.get(identifier);
  if (!stored) {
    return { valid: false, reason: "OTP not found or expired. Please request a new OTP." };
  }

  if (expectedChannel && stored.channel !== expectedChannel) {
    return { valid: false, reason: "OTP type mismatch. Please request a new OTP." };
  }

  if (isOtpExpired(stored.expiresAt)) {
    emailOtpStore.delete(identifier);
    return { valid: false, reason: "OTP has expired. Please request a new OTP." };
  }

  if (String(stored.otp) !== String(otp)) {
    return { valid: false, reason: "Invalid OTP. Please try again." };
  }

  emailOtpStore.delete(identifier);
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
      senderId,
      apiEndpoint: "https://2factor.in/API/V1/:api_key/SMS/:phone_number/:otp_value/:template_name",
      details: {
        message: isConfigured
          ? "SMS service is ready to send OTPs through 2Factor V1 custom OTP API"
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

// Test endpoint to diagnose 2Factor OTP API issues
router.get("/test-sms/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const testOtp = "123456";
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const sendPhone = `+${formattedPhone}`;
    const templateName = "OTP1";

    console.log(`\n🧪 Testing 2Factor V1 OTP API`);
    console.log(`Input Phone: ${phone}`);
    console.log(`Formatted Phone: ${formattedPhone}`);
    console.log(`Send Phone: ${sendPhone}`);

    const sendResponse = await sendOtpSMSVia2FA(sendPhone, testOtp);
    const verifyResponse = await verifyOtpVia2Factor(formattedPhone, testOtp);

    res.json({
      success: sendResponse?.success === true && verifyResponse?.matched === true,
      sendResponse,
      verifyResponse,
      diagnostics: {
        inputPhone: phone,
        formattedPhone,
        sendPhone,
        otp: testOtp,
        templateName,
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
      code: err.code,
      responseStatus: err.response?.status,
      responseData: err.response?.data,
    });
  }
});

router.post("/send-otp", async (req, res) => {
  const { identifier, debug } = req.body;
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return res.status(400).json({ message: "Email or mobile number is required" });
  }

  const isEmail = normalizedIdentifier.includes("@");

  try {
    console.log(`\n🔄 [OTP Request] Processing for: ${isEmail ? "EMAIL" : "SMS"}`);
    console.log(`📞 Normalized identifier: ${normalizedIdentifier}`);

    if (isEmail) {
      console.log(`📧 Attempting to send OTP via email...`);
      const otp = generateOtp();
      await sendOtpEmail(normalizedIdentifier, otp);
      // Email OTP stored for verification via email flow
      createSession(normalizedIdentifier, "email", otp);
      console.info(`✅ OTP email sent to ${normalizedIdentifier}`);
      return res.json({ message: "OTP sent to email successfully" });
    }

    // For SMS: Use 2Factor API for sending OTP via SMS only
    console.log(`📲 Attempting to send OTP via 2Factor API...`);
    const otp = generateOtp();

    const sendResult = await sendOtpSMSVia2FA(normalizedIdentifier, otp);

    if (sendResult?.message || sendResult?.messageId) {
      console.info(`✅ OTP sent via 2Factor API to ${normalizedIdentifier}`);
      const responsePayload = {
        message: "OTP sent to mobile successfully",
        messageId: sendResult?.messageId || null,
      };
      if (debug || process.env.NODE_ENV === "development") {
        responsePayload.smsApiResponse = sendResult?.apiResponse;
        responsePayload.smsApiRequestUrl = sendResult?.apiRequestUrl;
      }
      return res.json(responsePayload);
    }
    throw new Error("Failed to send OTP via SMS API");
  } catch (err) {
    console.error(`\n❌ [OTP Error] Failed for identifier: ${normalizedIdentifier}`);
    console.error(`Error message: ${err?.message}`);
    console.error(`Full error:`, err);
    
    const errorPayload = {
      message: `Failed to send OTP. ${err?.message || "Please try again."}`,
    };

    if (debug || process.env.NODE_ENV === "development") {
      errorPayload.error = err?.message;
      if (err.response?.data) {
        errorPayload.smsApiResponse = err.response.data;
        errorPayload.smsApiStatus = err.response.status;
      }
    }

    return res.status(500).json(errorPayload);
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
    // For SMS: verify via 2Factor API strictly (no local fallback)
    console.log(`\n🔐 [OTP Verification] Verifying SMS OTP for: ${normalizedIdentifier}`);
    try {
      const verifyResult = await verifyOtpVia2Factor(normalizedIdentifier, otp);
      if (!verifyResult?.matched) {
        console.warn(`❌ 2Factor API verification failed: ${verifyResult?.message}`);
        return res.status(400).json({ message: verifyResult?.message || "Invalid OTP. Please try again." });
      }
      console.log(`✅ SMS OTP verification successful for: ${normalizedIdentifier}`);
    } catch (err) {
      console.error(`❌ 2Factor API verification error: ${err.message}`);
      return res.status(400).json({ message: `OTP verification failed: ${err.message}` });
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
