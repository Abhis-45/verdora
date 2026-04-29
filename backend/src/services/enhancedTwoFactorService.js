import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.TWO_FACTOR_API_KEY;
const SENDER_ID = process.env.TWO_FACTOR_SENDER_ID || "VERDOR";
// Use Transactional SMS API - SMS only, no voice
const SMS_API_URL = "https://2factor.in/API/R1/SEND";

const validateApiConfiguration = () => {
  if (!API_KEY) {
    throw new Error("2Factor API key is not configured");
  }
};

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) throw new Error("Phone number is required");

  let cleaned = String(phoneNumber).replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
};

/**
 * Send OTP via SMS using Transactional SMS API (SMS-ONLY, no voice calls)
 * This uses 2Factor.in's approved template for SMS
 */
export const sendOtpSMS = async (phoneNumber, otp, userName = "User") => {
  validateApiConfiguration();

  const formattedPhone = formatPhoneNumber(phoneNumber);
  // Use the approved template format
  const message = `Hi ${userName}, Your one time password for phone verification is ${otp}.\nplease do not share otp with anyone.`;

  try {
    console.log(`\n📲 [SMS-OTP] Sending OTP SMS to ${formattedPhone}`);
    console.log(`📌 API Endpoint: ${SMS_API_URL} (Transactional SMS - SMS ONLY, no voice)`);
    console.log(`📌 Phone: ${formattedPhone}`);
    console.log(`📌 Message: ${message}`);

    // Use transactional SMS API for SMS-only delivery
    const response = await axios.get(SMS_API_URL, {
      params: {
        apikey: API_KEY,
        to: formattedPhone,
        msg: message,
        from: SENDER_ID,
      },
      timeout: 10000,
      validateStatus: () => true, // Capture all responses
    });

    console.log(`📤 API Response Status: ${response.status}`);
    console.log(`📤 API Response Data:`, JSON.stringify(response.data));

    const data = response.data;
    if (data?.Status === "Success") {
      console.log(`✅ OTP SMS sent successfully via Transactional API`);
      return {
        success: true,
        message: "OTP sent successfully via SMS",
        phoneNumber: formattedPhone,
        apiResponse: data,
      };
    }

    if (data?.Status === "Error") {
      const errorMsg = data?.Details || "API returned error";
      console.error(`❌ Transactional SMS API Error: ${errorMsg}`);
      throw new Error(`SMS API Error: ${errorMsg}`);
    }

    throw new Error(`Unexpected API response: ${JSON.stringify(data)}`);
  } catch (err) {
    console.error(`\n❌ Failed to send OTP SMS to ${formattedPhone}`);
    console.error(`Error: ${err.message}`);
    if (err.response?.data) {
      console.error("API Response:", err.response.data);
    }
    throw err;
  }
};

/**
 * Verify OTP - Use local verification instead of 2Factor API
 * This avoids voice call issues and is more reliable
 */
export const verifyOtp = async (phoneNumber, otp, storedOtp) => {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    console.log(`\n🔐 [OTP Verify] Verifying OTP for ${formattedPhone}`);
    
    // Simple local verification - compare OTPs
    if (String(storedOtp).trim() === String(otp).trim()) {
      console.log(`✅ OTP verification successful`);
      return { matched: true, message: "OTP verified successfully" };
    }

    console.warn(`❌ OTP mismatch - stored: ${storedOtp}, provided: ${otp}`);
    return { matched: false, message: "OTP does not match" };
  } catch (err) {
    console.error(`❌ OTP verification failed: ${err.message}`);
    throw err;
  }
};

const sendTransactionalSms = async (phoneNumber, message) => {
  validateApiConfiguration();

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const encodedMessage = String(message || "").slice(0, 160);

  try {
    console.log(`\n📱 [Transactional SMS] Sending to ${formattedPhone}`);
    
    const response = await axios.get(SMS_API_URL, {
      params: {
        apikey: API_KEY,
        to: formattedPhone,
        msg: encodedMessage,
      },
      timeout: 10000,
      validateStatus: () => true,
    });

    const data = response.data;
    if (data?.Status === "Success") {
      console.log(`✅ Transactional SMS sent successfully`);
      return data;
    }
    if (data?.Status === "Error") {
      console.error(`❌ Transactional SMS Error: ${data?.Details || "Unknown error"}`);
      throw new Error(data?.Details || "Transactional SMS API returned an error");
    }
    throw new Error(`Unexpected transactional SMS response: ${JSON.stringify(data)}`);
  } catch (err) {
    console.error(`Failed to send transactional SMS: ${err.message}`);
    if (err.response?.data) {
      console.error("Transactional SMS API response:", err.response.data);
    }
    throw err;
  }
};

export const sendTransactionalOtpSms = async (phoneNumber, otp, userName = "User") => {
  const message = `Hi ${userName}, Your OTP for Verdora verification is ${otp}. Valid for 10 minutes. Please do not share this OTP.`;
  return sendTransactionalSms(phoneNumber, message);
};

export const sendVendorRegistrationReceivedSMS = async (phoneNumber, vendorName) => {
  const message = `Hi ${vendorName}, your Verdora vendor application is received. We will review and contact you in 3-5 days.`;
  return sendTransactionalSms(phoneNumber, message);
};

export const sendOrderConfirmationSMS = async (phoneNumber, orderId, total) => {
  const message = `Your Verdora order #${String(orderId || "").slice(-6)} confirmed! Total: Rs.${Number(total || 0).toFixed(2)}. Track at https://verdora.com/orders`;
  return sendTransactionalSms(phoneNumber, message);
};

export const sendOrderShippedSMS = async (phoneNumber, orderId, estimatedDelivery) => {
  const message = `Your Verdora order #${String(orderId || "").slice(-6)} has shipped. Est. delivery: ${estimatedDelivery || "2-5 days"}. Track at https://verdora.com/orders`;
  return sendTransactionalSms(phoneNumber, message);
};

export const sendOrderDeliveredSMS = async (phoneNumber, orderId) => {
  const message = `Your Verdora order #${String(orderId || "").slice(-6)} was delivered. Please review it at https://verdora.com/orders`;
  return sendTransactionalSms(phoneNumber, message);
};

export const sendOrderCancelledSMS = async (phoneNumber, orderId) => {
  const message = `Your Verdora order #${String(orderId || "").slice(-6)} has been cancelled. Refund will be processed in 5-7 days.`;
  return sendTransactionalSms(phoneNumber, message);
};

export const sendRefundProcessedSMS = async (phoneNumber, orderId, refundAmount) => {
  const message = `Refund of Rs.${Number(refundAmount || 0).toFixed(2)} for order #${String(orderId || "").slice(-6)} is processed. It should reflect in 5-7 days.`;
  return sendTransactionalSms(phoneNumber, message);
};

export const sendVendorApprovedSMS = async (phoneNumber, vendorName) => {
  const message = `Congratulations ${vendorName}! Your Verdora vendor application has been approved. You can now start selling on our platform.`;
  return sendTransactionalSms(phoneNumber, message);
};

export const sendVendorRejectedSMS = async (phoneNumber, vendorName) => {
  const message = `Hi ${vendorName}, we regret to inform you that your Verdora vendor application could not be approved at this time. Please contact support for more details.`;
  return sendTransactionalSms(phoneNumber, message);
};

export const sendOrderStatusUpdateSMS = async (phoneNumber, orderId, status) => {
  const statusMessages = {
    shipped: "Your order has shipped!",
    delivered: "Your order is delivered!",
    returned: "Return request received.",
    replaced: "Replacement being processed.",
    refunded: "Refund processed.",
    cancelled: "Order cancelled.",
  };
  const statusMessage = statusMessages[status] || "Your order status was updated.";
  const message = `${statusMessage} Order #${String(orderId || "").slice(-6)}. Details: https://verdora.com/orders`;
  return sendTransactionalSms(phoneNumber, message);
};

export default {
  sendOtpSMS,
  verifyOtp,
  sendTransactionalOtpSms,
  sendVendorRegistrationReceivedSMS,
  sendOrderConfirmationSMS,
  sendOrderShippedSMS,
  sendOrderDeliveredSMS,
  sendOrderCancelledSMS,
  sendRefundProcessedSMS,
  sendVendorApprovedSMS,
  sendVendorRejectedSMS,
  sendOrderStatusUpdateSMS,
};
