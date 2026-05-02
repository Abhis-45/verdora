/**
 * SMS OTP utility functions.
 * Handles phone number formatting for Message Central OTP flows.
 */

/**
 * Format phone number to international format (with +91 for India)
 * @param phoneNumber - Raw phone number (can be with or without country code)
 * @returns Formatted phone number in international format
 */
export const formatPhoneForSMS = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // If already has country code (11+ digits), return with +
  if (cleaned.length >= 11) {
    return "+" + cleaned;
  }

  // If 10 digits (Indian number without country code), add +91
  if (cleaned.length === 10) {
    return "+91" + cleaned;
  }

  // If has country code at start, return as is with +
  if (cleaned.length > 10) {
    return "+" + cleaned;
  }

  // Return original if format unclear
  return phoneNumber;
};

/**
 * Validate phone number format
 * @param phoneNumber - Phone number to validate
 * @returns true if valid, false otherwise
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\D/g, "");
  return cleaned.length === 10 || cleaned.length === 12;
};

/**
 * Validate OTP format
 * @param otp - OTP to validate
 * @returns true if valid 6-digit OTP, false otherwise
 */
export const validateOtp = (otp: string): boolean => {
  return /^\d{6}$/.test(otp.trim());
};

/**
 * Mask phone number for display
 * @param phoneNumber - Phone number to mask
 * @returns Masked phone number
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, "");
  if (cleaned.length < 4) return phoneNumber;

  const last4 = cleaned.slice(-4);
  const masked = "*".repeat(cleaned.length - 4) + last4;
  return masked;
};

/**
 * Extract 10-digit phone number from various formats
 * @param phoneNumber - Phone number in any format
 * @returns 10-digit phone number or null if invalid
 */
export const extractPhoneDigits = (phoneNumber: string): string | null => {
  const cleaned = phoneNumber.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return cleaned;
  }

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }

  if (cleaned.length > 10) {
    return cleaned.slice(-10);
  }

  return null;
};

/**
 * Check if identifier is email or phone
 * @param identifier - Email or phone number
 * @returns "email" or "phone"
 */
export const getIdentifierType = (
  identifier: string
): "email" | "phone" => {
  return identifier.includes("@") ? "email" : "phone";
};
