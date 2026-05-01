import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  sendOtpSMS as sendOtpSMSVia2FA,
  verifyOtp,
  sendWelcomeSMS,
} from "../services/enhancedTwoFactorService.js";
import {
  sendOtpEmail,
  sendWelcomeEmail,
  verifyEmailTransporter,
} from "../services/emailService.js";
import { sanitizeUser } from "../utils/validators.js";
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

const createSession = (identifier, channel, otp = null, sessionId = null) => {
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  otpStore.set(identifier, {
    otp: otp !== null ? String(otp) : null,
    sessionId: sessionId ? String(sessionId) : null,
    channel,
    expiresAt,
    verified: false,
    attempts: 0,
  });
  console.log(`✅ OTP session created for ${identifier} (channel: ${channel}, expires: ${new Date(expiresAt).toISOString()})`);
};

const verifyStoredOtp = (identifier, otp, expectedChannel) => {
  console.log(`\n🔍 [OTP Debug] Verifying OTP for ${identifier}`);

  const stored = otpStore.get(identifier);
  console.log(`Stored data:`, stored ? {
    otp: stored.otp,
    sessionId: stored.sessionId,
    channel: stored.channel,
    expiresAt: stored.expiresAt,
    attempts: stored.attempts,
    verified: stored.verified,
  } : 'NOT FOUND');

  if (!stored) {
    console.log(`❌ No stored OTP found for ${identifier}`);
    return { valid: false, reason: "OTP not found or expired. Please request a new OTP." };
  }

  if (stored.verified) {
    console.log(`❌ OTP already verified for ${identifier}`);
    otpStore.delete(identifier);
    return { valid: false, reason: "OTP already used. Please request a new OTP." };
  }

  if (stored.attempts >= 5) {
    console.log(`❌ Too many attempts for ${identifier}`);
    otpStore.delete(identifier);
    return { valid: false, reason: "Too many failed attempts. Please request a new OTP." };
  }

  if (expectedChannel && stored.channel !== expectedChannel) {
    console.log(`❌ Channel mismatch: expected ${expectedChannel}, got ${stored.channel}`);
    return { valid: false, reason: "OTP type mismatch. Please request a new OTP." };
  }

  if (isOtpExpired(stored.expiresAt)) {
    console.log(`❌ OTP expired for ${identifier}`);
    otpStore.delete(identifier);
    return { valid: false, reason: "OTP has expired. Please request a new OTP." };
  }

  const storedOtpStr = String(stored.otp).trim();
  const providedOtpStr = String(otp).trim();

  console.log(`Comparing: stored="${storedOtpStr}" vs provided="${providedOtpStr}"`);

  stored.attempts += 1;

  if (storedOtpStr !== providedOtpStr) {
    console.log(`❌ OTP mismatch for ${identifier} (attempt ${stored.attempts}/5)`);
    return { valid: false, reason: "Invalid OTP. Please try again." };
  }

  stored.verified = true;
  console.log(`✅ OTP verification successful for ${identifier}`);
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

// Test endpoint to diagnose SMS OTP provider issues
router.get("/test-sms/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    const testOtp = "123456";
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`;

    console.log(`\n🧪 Testing SMS OTP provider`);
    console.log(`Input Phone: ${phone}`);
    console.log(`Formatted Phone: ${formattedPhone}`);

    const sendResponse = await sendOtpSMSVia2FA(formattedPhone, testOtp);
    console.log(`Send Response:`, sendResponse);

    res.json({
      success: sendResponse?.success === true,
      sendResponse,
      diagnostics: {
        inputPhone: phone,
        formattedPhone,
        otp: testOtp,
        provider: sendResponse?.provider,
      },
    });
  } catch (err) {
    console.error(`\n❌ SMS OTP Test Failed`);
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

    // For SMS: Use 2Factor Custom OTP API
    console.log(`📲 Attempting to send OTP via SMS...`);

    try {
      // Send via 2Factor API and get session ID if available
      const userName = "User";
      // Do not pass a pre-generated OTP; 2Factor will generate and send one
      const sendResult = await sendOtpSMSVia2FA(normalizedIdentifier, undefined, userName);
      console.info(`✅ OTP sent via SMS provider to ${normalizedIdentifier}`);

      createSession(
        normalizedIdentifier,
        "sms",
        sendResult.otp || null,
        sendResult.sessionId || null,
      );

      const responsePayload = {
        message: "OTP sent to mobile successfully",
        channel: "sms",
        provider: sendResult.provider,
      };
      if (debug || process.env.NODE_ENV === "development") {
        responsePayload.smsApiResponse = sendResult?.apiResponse;
      }
      return res.json(responsePayload);
    } catch (smsApiErr) {
      // SMS API failed - return error (no local fallback for new API)
      console.error(`❌ SMS API failed: ${smsApiErr.message}`);
      return res.status(500).json({
        message: "Failed to send SMS OTP. Please try again.",
        error: debug ? smsApiErr.message : undefined,
      });
    }
  } catch (err) {
    console.error(`\n❌ [OTP Error] Failed for identifier: ${normalizedIdentifier}`);
    console.error(`Error message: ${err?.message}`);
    
    const errorPayload = {
      message: `Failed to process OTP request. ${err?.message || "Please try again."}`,
    };

    if (debug || process.env.NODE_ENV === "development") {
      errorPayload.error = err?.message;
    }

    return res.status(500).json(errorPayload);
  }
});

router.post("/verify-otp", async (req, res) => {
  const { identifier, otp } = req.body;
  const normalizedIdentifier = normalizeIdentifier(identifier);

  console.log(`\n🔐 [OTP Verify Request] Starting verification for: ${normalizedIdentifier}`);
  console.log(`Provided OTP: ${otp}`);

  if (!normalizedIdentifier || !otp) {
    console.log(`❌ Missing required fields: identifier=${!!normalizedIdentifier}, otp=${!!otp}`);
    return res.status(400).json({ message: "Email/mobile and OTP are required" });
  }

  // Validate OTP format
  if (!/^\d{6}$/.test(String(otp).trim())) {
    console.log(`❌ Invalid OTP format: ${otp}`);
    return res.status(400).json({ message: "OTP must be 6 digits" });
  }

  const isEmail = normalizedIdentifier.includes("@");

  console.log(`Channel type: ${isEmail ? 'EMAIL' : 'SMS'}`);

  if (isEmail) {
    // For email: Use local OTP verification
    const otpCheck = verifyStoredOtp(normalizedIdentifier, otp, "email");
    if (!otpCheck.valid) {
      console.warn(`❌ Email OTP verification failed: ${otpCheck.reason}`);
      return res.status(400).json({ message: otpCheck.reason });
    }
  } else {
    // For SMS: verify with 2Factor session if available, otherwise fall back to local OTP verification
    const stored = otpStore.get(normalizedIdentifier);
    if (!stored) {
      console.warn(`❌ No SMS session found for ${normalizedIdentifier}`);
      return res.status(400).json({ message: "No active SMS session. Please request a new OTP." });
    }

    if (isOtpExpired(stored.expiresAt)) {
      console.log(`❌ SMS OTP expired for ${normalizedIdentifier}`);
      otpStore.delete(normalizedIdentifier);
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    if (stored.sessionId) {
      try {
        const verifyResult = await verifyOtp(stored.sessionId, otp);
        if (!verifyResult.success) {
          console.warn(`❌ SMS API verification failed for ${normalizedIdentifier}`);
          return res.status(400).json({ message: "Invalid OTP. Please try again." });
        }
        console.log(`✅ SMS API verification successful for ${normalizedIdentifier}`);
        otpStore.delete(normalizedIdentifier);
      } catch (apiError) {
        console.error(`❌ SMS API verification error: ${apiError.message}`);
        return res.status(500).json({ message: "SMS verification service error. Please try again." });
      }
    } else {
      const otpCheck = verifyStoredOtp(normalizedIdentifier, otp, "sms");
      if (!otpCheck.valid) {
        console.warn(`❌ SMS OTP verification failed: ${otpCheck.reason}`);
        return res.status(400).json({ message: otpCheck.reason });
      }
    }
  }

  console.log(`✅ ${isEmail ? "Email" : "SMS"} OTP verification successful for: ${normalizedIdentifier}`);

  let user = null;
  let userLookupError = null;
  try {
    user = await User.findOne(
      isEmail ? { email: normalizedIdentifier } : { mobile: normalizedIdentifier },
    );
  } catch (lookupError) {
    userLookupError = lookupError;
    console.warn(`⚠️ Could not lookup user due to DB issue: ${lookupError.message}`);
  }

  const isNewUser = !user;
  console.log(`User lookup result: ${user ? 'EXISTING' : 'NEW'} user`);

  if (!user) {
    if (userLookupError) {
      console.warn(`❌ Database error prevented user lookup/creation for ${normalizedIdentifier}`);
      return res.status(500).json({ message: "Unable to complete login at this time. Please try again later." });
    }

    console.log(`Creating new user for: ${normalizedIdentifier}`);
    user = new User(
      isEmail ? { email: normalizedIdentifier } : { mobile: normalizedIdentifier },
    );
    try {
      await user.save();
      console.log(`✅ New user created with ID: ${user._id}`);
    } catch (saveError) {
      console.error(`❌ Could not create new user due to DB issue: ${saveError.message}`);
      return res.status(500).json({ message: "Unable to create user account at this time. Please try again later." });
    }
  }

  try {
    if (isNewUser && isEmail) {
      await sendWelcomeEmail(normalizedIdentifier, user?.name || "Guest");
      console.log(`✅ Welcome email sent`);
    } else {
      console.log(`ℹ️ Welcome notification skipped for existing user or SMS login`);
    }
  } catch (_notificationErr) {
    console.warn(`⚠️ Welcome notification failed: ${_notificationErr.message}`);
    // Welcome notification should not block login.
  }

  console.log(`Generating JWT token for user: ${user?._id || 'unknown'}`);
  const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  console.log(`✅ Login successful for ${normalizedIdentifier} (User ID: ${user._id})`);

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

  let user = await User.findOne(normalizedEmail ? { email: normalizedEmail } : { mobile: normalizedMobile });

  if (user) {
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.json({ message: "Login successful", token, user: sanitizeUser(user) });
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

  return res.json({ message: "Registered successfully", token, user: sanitizeUser(user) });
});

export default router;
