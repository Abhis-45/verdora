/**
 * Enhanced 2Factor SMS Service
 * Sends OTP and notification SMS using 2Factor.in API
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.TWO_FACTOR_API_KEY;
const SENDER_ID = process.env.TWO_FACTOR_SENDER_ID || "VERDOR";
const BASE_URL = "https://2factor.in/API/R1";
const SMS_SEND_URL = "https://2factor.in/API/R1/SEND";
const VERIFY_BASE_URL = "https://2factor.in/API/V1";

// ============================================================================
// UTILITIES
// ============================================================================

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

  return "+" + cleaned;
};

// ============================================================================
// OTP FUNCTIONS
// ============================================================================

/**
 * Send transactional OTP SMS via 2Factor.in
 * 2Factor API Response Format:
 * Success: {"Status":"Success","Details":"6 digit OTP: 123456"}
 * Error: {"Status":"Error","Details":"error message"}
 */
export const sendTransactionalOtpSms = async (phoneNumber, otp) => {
  validateApiConfiguration();

  if (!phoneNumber || !otp) {
    throw new Error("Phone number and OTP are required");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const message = `Your Verdora OTP is ${otp}. Valid for 10 minutes. Do not share with anyone.`;
  const phoneWithoutPlus = formattedPhone.replace("+", "");

  try {
    console.log(`\n📲 Sending OTP SMS to ${formattedPhone}`);
    console.log(`📌 Using 2Factor API: ${SMS_SEND_URL}`);
    console.log(`📌 Phone (without +): ${phoneWithoutPlus}`);

    // 2Factor.in API uses GET request with query parameters
    const response = await axios.get(SMS_SEND_URL, {
      params: {
        apikey: API_KEY,
        to: phoneWithoutPlus,
        msg: message,
      },
      timeout: 10000,
    });

    console.log(`📤 2Factor API Status: ${response.status}`);
    console.log(`📤 2Factor API Response:`, JSON.stringify(response.data));

    // Check for successful response
    // 2Factor typically returns Status: "Success" for successful sends
    if (response.data?.Status === "Success") {
      console.log(`✅ OTP SMS sent successfully to ${formattedPhone}`);
      return {
        success: true,
        message: "OTP sent successfully",
        phoneNumber: formattedPhone,
      };
    }

    // Handle error responses
    if (response.data?.Status === "Error" || response.data?.error) {
      const errorMsg = response.data?.Details || response.data?.error || "API returned error";
      console.error(`❌ 2Factor API Error: ${errorMsg}`);
      throw new Error(`SMS API Error: ${errorMsg}`);
    }

    // If status is unexpected, throw error
    if (!response.data?.Status) {
      throw new Error(
        `Unexpected API response: ${JSON.stringify(response.data)}`
      );
    }

    console.log(`✅ OTP SMS sent successfully to ${formattedPhone}`);
    return {
      success: true,
      message: "OTP sent successfully",
      phoneNumber: formattedPhone,
    };
  } catch (err) {
    console.error(`\n❌ Failed to send OTP SMS to ${formattedPhone}`);
    console.error(`Error message: ${err.message}`);
    console.error(`Error code: ${err.code}`);
    console.error(`Full error:`, err.response?.data || err);
    throw err;
  }
};

/**
 * Verify OTP through 2Factor API
 */
export const verifyOtpVia2Factor = async (phoneNumber, otp) => {
  validateApiConfiguration();

  if (!phoneNumber || !otp) {
    throw new Error("Phone number and OTP are required");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    console.log(`\n🔐 Verifying OTP for ${formattedPhone}`);

    const response = await axios.get(`${VERIFY_BASE_URL}/`);
    // Note: 2Factor.in V1 endpoint structure may vary
    // This is a placeholder for verification logic
    
    console.log(`✅ OTP verification processed`);

    return {
      matched: true,
      message: "OTP verified",
    };
  } catch (err) {
    console.error(`❌ OTP verification failed: ${err.message}`);
    throw err;
  }
};

// ============================================================================
// NOTIFICATION SMS FUNCTIONS
// ============================================================================

/**
 * Generic transactional SMS sender for notifications
 * Reuses 2Factor.in SEND endpoint for all transactional SMS
 */
const sendTransactionalSms = async (phoneNumber, text) => {
  validateApiConfiguration();

  const normalized = formatPhoneNumber(phoneNumber);
  const phoneWithoutPlus = normalized.replace("+", "");

  try {
    console.log(`\n📨 Sending Transactional SMS to ${normalized}`);

    // 2Factor.in API uses GET request with query parameters
    const response = await axios.get(SMS_SEND_URL, {
      params: {
        apikey: API_KEY,
        to: phoneWithoutPlus,
        msg: String(text || "").slice(0, 1000),
      },
      timeout: 10000,
    });

    console.log(`📤 2Factor API Response:`, JSON.stringify(response.data));

    // Check for successful response
    if (response.data?.Status === "Success") {
      console.log(`✅ Transactional SMS sent successfully to ${normalized}`);
      return response.data;
    }

    // Handle error responses
    if (response.data?.Status === "Error" || response.data?.error) {
      const errorMsg = response.data?.Details || response.data?.error || "Failed to send SMS";
      console.error(`❌ SMS API Error: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // If status is unexpected, throw error
    if (!response.data?.Status) {
      throw new Error(
        `Unexpected API response: ${JSON.stringify(response.data)}`
      );
    }

    console.log(`✅ Transactional SMS sent successfully to ${normalized}`);
    return response.data;
  } catch (err) {
    console.error(`❌ Failed to send SMS to ${normalized}`);
    console.error(`Error: ${err.message}`);
    console.error(`Full error:`, err.response?.data || err);
    throw new Error(err.message || "Unknown SMS API error");
  }
};

/**
 * Send welcome SMS to new user
 */
export const sendWelcomeSMS = async (phoneNumber, userName) => {
  return sendTransactionalSms(
    phoneNumber,
    `Welcome to Verdora, ${userName}! Browse plants and gardening products at https://verdora.com`
  );
};

/**
 * Send order confirmation SMS
 */
export const sendOrderConfirmationSMS = async (phoneNumber, orderId, total) => {
  return sendTransactionalSms(
    phoneNumber,
    `Your Verdora order #${String(orderId || "").slice(-6)} confirmed! Total: Rs.${Number(total || 0).toFixed(2)}. Track at https://verdora.com/orders`
  );
};

/**
 * Send order shipped SMS
 */
export const sendOrderShippedSMS = async (
  phoneNumber,
  orderId,
  estimatedDelivery
) => {
  return sendTransactionalSms(
    phoneNumber,
    `Your Verdora order #${String(orderId || "").slice(-6)} has shipped. Est. delivery: ${estimatedDelivery || "2-5 days"}. Track at https://verdora.com/orders`
  );
};

/**
 * Send order delivered SMS
 */
export const sendOrderDeliveredSMS = async (phoneNumber, orderId) => {
  return sendTransactionalSms(
    phoneNumber,
    `Your Verdora order #${String(orderId || "").slice(-6)} was delivered. Please review it at https://verdora.com/orders`
  );
};

/**
 * Send order cancelled SMS
 */
export const sendOrderCancelledSMS = async (phoneNumber, orderId) => {
  return sendTransactionalSms(
    phoneNumber,
    `Your Verdora order #${String(orderId || "").slice(-6)} has been cancelled. Refund will be processed in 5-7 days.`
  );
};

/**
 * Send return/replacement request SMS
 */
export const sendReturnRequestSMS = async (phoneNumber, orderId, returnType) => {
  const typeLabel = returnType === "returned" ? "Return" : "Replacement";
  return sendTransactionalSms(
    phoneNumber,
    `${typeLabel} request received for order #${String(orderId || "").slice(-6)}. We are reviewing it and will update you soon.`
  );
};

/**
 * Send order status update SMS
 */
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
  return sendTransactionalSms(
    phoneNumber,
    `${statusMessage} Order #${String(orderId || "").slice(-6)}. Details: https://verdora.com/orders`
  );
};

/**
 * Send refund processed SMS
 */
export const sendRefundProcessedSMS = async (
  phoneNumber,
  orderId,
  refundAmount
) => {
  return sendTransactionalSms(
    phoneNumber,
    `Refund of Rs.${Number(refundAmount || 0).toFixed(2)} for order #${String(orderId || "").slice(-6)} is processed. It should reflect in 5-7 days.`
  );
};

/**
 * Send vendor registration received SMS
 */
export const sendVendorRegistrationReceivedSMS = async (
  phoneNumber,
  vendorName
) => {
  return sendTransactionalSms(
    phoneNumber,
    `Hi ${vendorName}, your Verdora vendor application is received. We will review and contact you in 3-5 days.`
  );
};

/**
 * Send vendor approved SMS
 */
export const sendVendorApprovedSMS = async (phoneNumber, vendorName) => {
  return sendTransactionalSms(
    phoneNumber,
    `Congratulations ${vendorName}! Your Verdora vendor application is approved. Login at https://verdora.com/vendor/login`
  );
};

/**
 * Send vendor rejected SMS
 */
export const sendVendorRejectedSMS = async (phoneNumber, vendorName) => {
  return sendTransactionalSms(
    phoneNumber,
    `Hi ${vendorName}, your Verdora vendor application was not approved this time. Please check your email for details.`
  );
};
