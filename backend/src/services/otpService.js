import axios from "axios";
import { sendOtpEmail } from "./emailService.js";

const MESSAGE_CENTRAL_BASE_URL =
  process.env.MESSAGE_CENTRAL_API_URL || "https://cpaas.messagecentral.com";
const DEFAULT_COUNTRY_CODE = String(
  process.env.MESSAGE_CENTRAL_COUNTRY_CODE || "91",
).replace(/\D/g, "");
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const SMS_FLOW_TYPE = process.env.MESSAGE_CENTRAL_FLOW_TYPE || "SMS";
const SMS_OTP_LENGTH = Math.min(
  8,
  Math.max(4, Number(process.env.MESSAGE_CENTRAL_OTP_LENGTH || 6)),
);

const otpStore = new Map();
let messageCentralTokenCache = {
  token: null,
  expiresAt: 0,
};

const responseCodeMessages = {
  200: "SUCCESS",
  400: "BAD_REQUEST",
  409: "DUPLICATE_RESOURCE",
  500: "SERVER_ERROR",
  501: "INVALID_CUSTOMER_ID",
  505: "INVALID_VERIFICATION_ID",
  506: "REQUEST_ALREADY_EXISTS",
  511: "INVALID_COUNTRY_CODE",
  700: "VERIFICATION_FAILED",
  702: "WRONG_OTP_PROVIDED",
  703: "ALREADY_VERIFIED",
  705: "VERIFICATION_EXPIRED",
  800: "MAXIMUM_LIMIT_REACHED",
};

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isOtpExpired = (expiresAt) => {
  return Date.now() > Number(expiresAt || 0);
};

const normalizeEmail = (email) => {
  return String(email || "").trim().toLowerCase();
};

export const isEmailIdentifier = (identifier) => {
  return String(identifier || "").includes("@");
};

export const normalizePhone = (phone) => {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 10) return `${DEFAULT_COUNTRY_CODE}${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  }
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length > 10) {
    return digits;
  }

  return digits;
};

export const normalizePhoneForUser = (phone) => {
  const normalized = normalizePhone(phone);
  return normalized ? `+${normalized}` : "";
};

const splitPhoneForMessageCentral = (phone) => {
  const normalized = normalizePhone(phone);

  if (!normalized) {
    return { countryCode: DEFAULT_COUNTRY_CODE, mobileNumber: "", e164: "" };
  }

  if (normalized.startsWith(DEFAULT_COUNTRY_CODE)) {
    return {
      countryCode: DEFAULT_COUNTRY_CODE,
      mobileNumber: normalized.slice(DEFAULT_COUNTRY_CODE.length),
      e164: `+${normalized}`,
    };
  }

  return {
    countryCode: DEFAULT_COUNTRY_CODE,
    mobileNumber: normalized,
    e164: `+${DEFAULT_COUNTRY_CODE}${normalized}`,
  };
};

const getMessageCentralCustomerId = () => {
  return process.env.MESSAGE_CENTRAL_CUSTOMER_ID || "";
};

const getMessageCentralKey = () => {
  if (process.env.MESSAGE_CENTRAL_KEY) {
    return process.env.MESSAGE_CENTRAL_KEY;
  }

  if (process.env.MESSAGE_CENTRAL_PASSWORD) {
    return Buffer.from(process.env.MESSAGE_CENTRAL_PASSWORD).toString("base64");
  }

  return process.env.MESSAGECENTRAL_API_KEY || "";
};

const getMessageCentralAuthToken = async () => {
  const staticToken = process.env.MESSAGE_CENTRAL_AUTH_TOKEN || "";
  const customerId = getMessageCentralCustomerId();
  const key = getMessageCentralKey();

  if (messageCentralTokenCache.token && messageCentralTokenCache.expiresAt > Date.now()) {
    return messageCentralTokenCache.token;
  }

  if (!customerId || !key) {
    if (staticToken) return staticToken;
    throw new Error(
      "Message Central credentials are missing. Configure MESSAGE_CENTRAL_CUSTOMER_ID and MESSAGE_CENTRAL_KEY or MESSAGE_CENTRAL_PASSWORD.",
    );
  }

  try {
    const response = await axios.get(
      `${MESSAGE_CENTRAL_BASE_URL}/auth/v1/authentication/token`,
      {
        params: {
          customerId,
          key,
          scope: process.env.MESSAGE_CENTRAL_SCOPE || "NEW",
          country: process.env.MESSAGE_CENTRAL_AUTH_COUNTRY || DEFAULT_COUNTRY_CODE,
          ...(process.env.MESSAGE_CENTRAL_EMAIL
            ? { email: process.env.MESSAGE_CENTRAL_EMAIL }
            : {}),
        },
        headers: {
          accept: "*/*",
        },
        timeout: 15000,
      },
    );

    const token = response.data?.token;
    if (!token) {
      throw new Error("Token was not returned by Message Central");
    }

    messageCentralTokenCache = {
      token,
      expiresAt: Date.now() + 23 * 60 * 60 * 1000,
    };

    return token;
  } catch (error) {
    if (staticToken) return staticToken;
    throw error;
  }
};

const getProviderMessage = (responseData, fallback) => {
  const data = responseData?.data || {};
  const code = data.responseCode || responseData?.responseCode || responseData?.status;
  const message = data.errorMessage || responseData?.message || responseCodeMessages[code];
  return message && message !== "SUCCESS" ? message : fallback;
};

export const sendOtpViaEmail = async (email, otp) => {
  try {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return { success: false, error: "Invalid email address" };
    }

    otpStore.set(normalizedEmail, {
      channel: "email",
      otp: String(otp),
      expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
      attempts: 0,
    });

    await sendOtpEmail(normalizedEmail, otp);

    return {
      success: true,
      message: "OTP sent to your email",
      provider: "email",
      identifier: normalizedEmail,
    };
  } catch (error) {
    console.error("Failed to send email OTP:", error.message);
    return {
      success: false,
      error: "Failed to send OTP. Please try again later.",
    };
  }
};

export const sendOtpViaSms = async (phone) => {
  try {
    const phoneParts = splitPhoneForMessageCentral(phone);

    if (!phoneParts.mobileNumber || phoneParts.mobileNumber.length < 10) {
      return { success: false, error: "Invalid phone number" };
    }

    const authToken = await getMessageCentralAuthToken();
    const customerId = getMessageCentralCustomerId();

    const response = await axios.post(
      `${MESSAGE_CENTRAL_BASE_URL}/verification/v3/send`,
      null,
      {
        params: {
          countryCode: phoneParts.countryCode,
          flowType: SMS_FLOW_TYPE,
          mobileNumber: phoneParts.mobileNumber,
          otpLength: SMS_OTP_LENGTH,
          ...(customerId ? { customerId } : {}),
        },
        headers: {
          accept: "*/*",
          authToken,
        },
        timeout: 15000,
      },
    );

    const responseData = response.data || {};
    const data = responseData.data || {};
    const responseCode = Number(data.responseCode || responseData.responseCode);
    const verificationId = data.verificationId;

    if (responseCode === 200 && verificationId && !data.errorMessage) {
      const timeoutSeconds = Number(data.timeout || 0);

      otpStore.set(`sms_${phoneParts.e164}`, {
        channel: "sms",
        verificationId,
        phone: phoneParts.e164,
        mobileNumber: phoneParts.mobileNumber,
        countryCode: phoneParts.countryCode,
        attempts: 0,
        expiresAt:
          Date.now() +
          (timeoutSeconds > 0
            ? timeoutSeconds * 1000
            : OTP_EXPIRY_MINUTES * 60 * 1000),
      });

      return {
        success: true,
        message: "OTP sent to your phone number",
        provider: "sms",
        verificationId,
        identifier: phoneParts.e164,
      };
    }

    return {
      success: false,
      error: getProviderMessage(responseData, "Failed to send SMS OTP"),
    };
  } catch (error) {
    const providerData = error.response?.data;
    console.error("Failed to send SMS OTP:", providerData || error.message);
    return {
      success: false,
      error: getProviderMessage(
        providerData,
        "Failed to send OTP via SMS. Please try again later.",
      ),
    };
  }
};

export const sendOtp = async (identifier) => {
  const normalized = String(identifier || "").trim();

  if (!normalized) {
    return { success: false, error: "Email or phone number is required" };
  }

  if (isEmailIdentifier(normalized)) {
    return sendOtpViaEmail(normalized, generateOtp());
  }

  return sendOtpViaSms(normalized);
};

export const verifyEmailOtp = (email, otp) => {
  try {
    const normalizedEmail = normalizeEmail(email);
    const stored = otpStore.get(normalizedEmail);

    if (!stored || stored.channel !== "email") {
      return { valid: false, message: "OTP not found or expired. Please request a new OTP." };
    }

    if (stored.attempts >= OTP_MAX_ATTEMPTS) {
      otpStore.delete(normalizedEmail);
      return { valid: false, message: "Too many failed attempts. Please request a new OTP." };
    }

    if (isOtpExpired(stored.expiresAt)) {
      otpStore.delete(normalizedEmail);
      return { valid: false, message: "OTP has expired. Please request a new OTP." };
    }

    stored.attempts += 1;

    if (String(stored.otp).trim() !== String(otp || "").trim()) {
      return { valid: false, message: "Invalid OTP. Please try again." };
    }

    otpStore.delete(normalizedEmail);
    return { valid: true, message: "OTP verified successfully" };
  } catch (error) {
    console.error("Error verifying email OTP:", error.message);
    return { valid: false, message: "Error verifying OTP" };
  }
};

export const verifySmsOtp = async (phone, otp, verificationIdFromRequest = "") => {
  try {
    const phoneParts = splitPhoneForMessageCentral(phone);
    const storeKey = `sms_${phoneParts.e164}`;
    const stored = otpStore.get(storeKey);
    const verificationId = stored?.verificationId || verificationIdFromRequest;

    if (!verificationId) {
      return { valid: false, message: "OTP not found or expired. Please request a new OTP." };
    }

    if (stored?.attempts >= OTP_MAX_ATTEMPTS) {
      otpStore.delete(storeKey);
      return { valid: false, message: "Too many failed attempts. Please request a new OTP." };
    }

    if (stored && isOtpExpired(stored.expiresAt)) {
      otpStore.delete(storeKey);
      return { valid: false, message: "OTP has expired. Please request a new OTP." };
    }

    const authToken = await getMessageCentralAuthToken();
    const customerId = getMessageCentralCustomerId();

    const response = await axios.get(
      `${MESSAGE_CENTRAL_BASE_URL}/verification/v3/validateOtp`,
      {
        params: {
          verificationId,
          code: String(otp || "").trim(),
          countryCode: phoneParts.countryCode,
          mobileNumber: phoneParts.mobileNumber,
          flowType: SMS_FLOW_TYPE,
          ...(customerId ? { customerId } : {}),
        },
        headers: {
          accept: "*/*",
          authToken,
        },
        timeout: 15000,
      },
    );

    if (stored) stored.attempts += 1;

    const responseData = response.data || {};
    const data = responseData.data || {};
    const completed = data.verificationStatus === "VERIFICATION_COMPLETED";
    const responseCode = Number(data.responseCode || responseData.responseCode);

    if (completed && responseCode === 200 && !data.errorMessage) {
      otpStore.delete(storeKey);
      return { valid: true, message: "OTP verified successfully" };
    }

    return {
      valid: false,
      message: getProviderMessage(responseData, "Invalid OTP. Please try again."),
    };
  } catch (error) {
    const providerData = error.response?.data;
    console.error("Error verifying SMS OTP:", providerData || error.message);
    return {
      valid: false,
      message: getProviderMessage(providerData, "Error verifying OTP. Please try again."),
    };
  }
};

export const verifyOtp = async (identifier, otp, verificationId = "") => {
  const normalized = String(identifier || "").trim();

  if (!normalized) {
    return { valid: false, message: "Email or phone number is required" };
  }

  if (isEmailIdentifier(normalized)) {
    return verifyEmailOtp(normalized, otp);
  }

  return verifySmsOtp(normalized, otp, verificationId);
};

export const resendOtp = async (identifier) => {
  const normalized = String(identifier || "").trim();

  if (!normalized) {
    return { success: false, error: "Email or phone number is required" };
  }

  if (isEmailIdentifier(normalized)) {
    otpStore.delete(normalizeEmail(normalized));
  } else {
    otpStore.delete(`sms_${splitPhoneForMessageCentral(normalized).e164}`);
  }

  return sendOtp(normalized);
};

export const clearOtp = (identifier) => {
  const normalized = String(identifier || "").trim();

  if (!normalized) return;

  if (isEmailIdentifier(normalized)) {
    otpStore.delete(normalizeEmail(normalized));
  } else {
    otpStore.delete(`sms_${splitPhoneForMessageCentral(normalized).e164}`);
  }
};

export default {
  generateOtp,
  sendOtp,
  sendOtpViaEmail,
  sendOtpViaSms,
  verifyOtp,
  verifyEmailOtp,
  verifySmsOtp,
  resendOtp,
  clearOtp,
  normalizePhone,
  normalizePhoneForUser,
};
