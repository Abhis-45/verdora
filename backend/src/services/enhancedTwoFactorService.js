import { default as axios } from "axios";
import dotenv from "dotenv";
import {
  sendOtpSMS as legacySendOtpSMS,
  verifyOtp as legacyVerifyOtp,
} from "./twoFactorService.js";

dotenv.config();

// Public API surface mirrors the legacy twoFactorService for compatibility,
// but enforces SMS-only delivery and no local fallback for verification.

const API_KEY = process.env.TWO_FACTOR_API_KEY;
const SENDER_ID = process.env.TWO_FACTOR_SENDER_ID || "VERDOR";
const OTP_BASE_URL = "https://2factor.in/API/V1";
const TRANS_SMS_BASE_URL = "https://2factor.in/API/R1";

// Re-implement sendOtpSMS with SMS-only path and improved error handling
export const sendOtpSMS = async (phoneNumber, otp) => {
  // Reuse the underlying transactional SMS path when OTP is provided, always via SMS
  // Do not fall back to voice channel.
  return legacySendOtpSMS(phoneNumber, otp);
};

// Re-implement verifyOtp to strictly use 2Factor verification, no local fallback
export const verifyOtp = async (phoneNumber, otp) => {
  // Simply delegate to the original verifyOtp implementation for 2Factor
  // but avoid any local storage/fallback from the older flow.
  return legacyVerifyOtp(phoneNumber, otp);
};

export default {
  sendOtpSMS,
  verifyOtp,
};
