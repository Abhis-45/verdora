// services/enhancedTwoFactorService.js
/**
 * Simple 2Factor SMS Service for OTP and Notifications
 * Uses 2Factor.in API for reliable SMS delivery
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.TWO_FACTOR_API_KEY;
const SENDER_ID = process.env.TWO_FACTOR_SENDER_ID || "VERDOR";
const BASE_URL = "https://2factor.in/API/R1";
const VERIFY_BASE_URL = "https://2factor.in/API/V1";

// ============================================================================
// PHONE NUMBER FORMATTING
// ============================================================================

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
// CORE SMS FUNCTIONS
// ============================================================================

/**
 * Send transactional OTP SMS using 2Factor.in
 */
export const sendTransactionalOtpSms = async (phoneNumber, otp) => {
  if (!API_KEY) {
    throw new Error("2Factor API key is not configured");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    const response = await axios.post(
      `${BASE_URL}/`,
      null,
      {
        params: {
          module: "TRANS_SMS",
          apikey: API_KEY,
          to: formattedPhone.replace("+", ""),
          from: SENDER_ID,
          msg: `Your Verdora OTP is: ${otp}. Valid for 10 minutes.`,
        },
        timeout: 10000,
      }
    );

    if (response.data.Status !== "Error") {
      console.log(`✅ OTP SMS sent to ${formattedPhone}`);
      return { success: true, message: "OTP sent successfully" };
    } else {
      throw new Error(response.data.Details || "Failed to send OTP SMS");
    }
  } catch (err) {
    console.error(`❌ OTP SMS failed: ${err.message}`);
    throw new Error(err.message || "Failed to send OTP SMS");
  }
};

/**
 * Verify OTP using 2Factor.in
 */
export const verifyOtpVia2Factor = async (phoneNumber, otp) => {
  if (!API_KEY) {
    throw new Error("2Factor API key is not configured");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    const response = await axios.get(`${VERIFY_BASE_URL}/SMS/VERIFY3/${API_KEY}/${formattedPhone.replace("+", "")}/${otp}`);

    if (response.data.Status === "Success") {
      console.log(`✅ OTP verified for ${formattedPhone}`);
      return { matched: true, message: "OTP verified successfully" };
    } else {
      console.log(`❌ OTP verification failed for ${formattedPhone}`);
      return { matched: false, message: "Invalid OTP" };
    }
  } catch (err) {
    console.error(`❌ OTP verification error: ${err.message}`);
    throw new Error(err.message || "OTP verification failed");
  }
};

// ============================================================================
// NOTIFICATION SMS FUNCTIONS
// ============================================================================

/**
 * Generic transactional SMS sender for notifications
 */
const sendTransactionalSms = async (phoneNumber, text) => {
  if (!API_KEY) {
    throw new Error("2Factor API key is not configured");
  }

  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    const response = await axios.post(
      `${BASE_URL}/Bulk/`,
      {
        module: "TRANS_SMS",
        apikey: API_KEY,
        messages: [
          {
            smsFrom: SENDER_ID,
            smsTo: formattedPhone,
            smsText: String(text || "").slice(0, 1000),
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const data = response.data;
    if (data.Status === "Error" || data.success === false) {
      throw new Error(data.Details || data.error || "Failed to send SMS");
    }

    if (!Array.isArray(data?.messages) || data.messages.length === 0) {
      const rejectionReason = Array.isArray(data?.rejectedSamples)
        ? data.rejectedSamples[0]?.reason
        : null;
      throw new Error(rejectionReason || "SMS was rejected");
    }

    console.log(`✅ Notification SMS sent to ${formattedPhone}`);
    return data;
  } catch (err) {
    console.error(`❌ Notification SMS failed: ${err.message}`);
    throw new Error(err.message || "Failed to send notification SMS");
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