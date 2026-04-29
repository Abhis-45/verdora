import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.TWO_FACTOR_API_KEY;
const SENDER_ID = process.env.TWO_FACTOR_SENDER_ID || "VERDOR";
const OTP_TEMPLATE_NAME = process.env.TWO_FACTOR_OTP_TEMPLATE || "OTP1";
const OTP_BASE_URL = "https://2factor.in/API/V1";
const TRANS_SMS_BASE_URL = "https://2factor.in/API/R1/SEND";

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

export const sendOtpSMS = async (phoneNumber, otp) => {
  validateApiConfiguration();

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const requestUrl = `${OTP_BASE_URL}/${API_KEY}/SMS/${encodeURIComponent(formattedPhone)}/${encodeURIComponent(otp)}/${encodeURIComponent(OTP_TEMPLATE_NAME)}`;

  try {
    const response = await axios.get(requestUrl, {
      timeout: 10000,
      validateStatus: () => true,
    });

    const data = response.data;
    if (data?.Status === "Success") {
      return {
        success: true,
        message: "OTP sent successfully",
        sessionId: data.Details,
        apiResponse: data,
        apiRequestUrl: requestUrl,
      };
    }

    if (data?.Status === "Error") {
      throw new Error(data?.Details || "OTP API returned an error");
    }

    throw new Error(`Unexpected OTP API response: ${JSON.stringify(data)}`);
  } catch (err) {
    console.error(`Failed to send OTP SMS: ${err.message}`);
    if (err.response?.data) {
      console.error("OTP API response:", err.response.data);
    }
    throw err;
  }
};

export const verifyOtp = async (phoneNumber, otp) => {
  validateApiConfiguration();

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const requestUrl = `${OTP_BASE_URL}/${API_KEY}/SMS/VERIFY3/${encodeURIComponent(formattedPhone)}/${encodeURIComponent(otp)}`;

  try {
    const response = await axios.get(requestUrl, {
      timeout: 10000,
      validateStatus: () => true,
    });

    const data = response.data;
    if (data?.Status === "Success") {
      return { matched: true, message: data?.Details || "OTP verified" };
    }

    if (data?.Status === "Error") {
      return { matched: false, message: data?.Details || "OTP verification failed" };
    }

    throw new Error(`Unexpected OTP verification response: ${JSON.stringify(data)}`);
  } catch (err) {
    console.error(`OTP verification failed: ${err.message}`);
    if (err.response?.data) {
      console.error("OTP verify API response:", err.response.data);
    }
    throw err;
  }
};

const sendTransactionalSms = async (phoneNumber, message) => {
  validateApiConfiguration();

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const encodedMessage = String(message || "").slice(0, 160);

  try {
    const response = await axios.get(TRANS_SMS_BASE_URL, {
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
      return data;
    }
    if (data?.Status === "Error") {
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
