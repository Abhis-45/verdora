import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.TWO_FACTOR_API_KEY;
const SENDER_ID = process.env.TWO_FACTOR_SENDER_ID || "VERDOR";
const OTP_BASE_URL = "https://2factor.in/API/V1";
const TRANS_SMS_BASE_URL = "https://2factor.in/API/R1";

const ORDER_STATUS_MESSAGES = {
  shipped: "Your order has shipped!",
  delivered: "Your order is delivered!",
  returned: "Return request received.",
  replaced: "Replacement being processed.",
  refunded: "Refund processed.",
  cancelled: "Order cancelled.",
};

const requireApiKey = () => {
  if (!API_KEY) {
    throw new Error("2Factor API key is not configured");
  }
};

const normalizePhoneNumber = (phoneNumber) => {
  const digits = String(phoneNumber || "").replace(/\D/g, "");

  if (!digits) {
    throw new Error("Phone number is required");
  }

  if (digits.length === 10) {
    return {
      withPlus: `+91${digits}`,
      withoutPlus: `91${digits}`,
    };
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    const local = digits.slice(1);
    return {
      withPlus: `+91${local}`,
      withoutPlus: `91${local}`,
    };
  }

  if (digits.length >= 11 && digits.length <= 15) {
    return {
      withPlus: `+${digits}`,
      withoutPlus: digits,
    };
  }

  throw new Error("Phone number must be a valid mobile number");
};

const parseResponseData = (payload) => {
  if (typeof payload !== "string") {
    return payload || {};
  }

  try {
    return JSON.parse(payload);
  } catch (_err) {
    return { Details: payload };
  }
};

const parseAxiosError = (err) => {
  const data = parseResponseData(err?.response?.data);
  const detailsMessage = Array.isArray(data?.details)
    ? data.details
        .map((item) => item?.error || item?.reason || item?.details)
        .filter(Boolean)
        .join(", ")
    : null;
  return (
    data?.Details ||
    data?.error ||
    detailsMessage ||
    data?.message ||
    err?.message ||
    "Unknown SMS API error"
  );
};

const isErrorResponse = (data) =>
  data?.Status === "Error" || data?.success === false;

const assertSuccess = (data, fallbackMessage) => {
  if (isErrorResponse(data)) {
    const detailsMessage = Array.isArray(data?.details)
      ? data.details
          .map((item) => item?.error || item?.reason || item?.details)
          .filter(Boolean)
          .join(", ")
      : null;
    throw new Error(data?.Details || data?.error || detailsMessage || fallbackMessage);
  }
};

const sendTransactionalSms = async (phoneNumber, text) => {
  requireApiKey();
  const normalized = normalizePhoneNumber(phoneNumber);

  try {
    const response = await axios.post(
      `${TRANS_SMS_BASE_URL}/Bulk/`,
      {
        module: "TRANS_SMS",
        apikey: API_KEY,
        messages: [
          {
            smsFrom: SENDER_ID,
            smsTo: normalized.withPlus,
            smsText: String(text || "").slice(0, 1000),
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = parseResponseData(response.data);
    assertSuccess(data, "Failed to send transactional SMS");
    if (!Array.isArray(data?.messages) || data.messages.length === 0) {
      const rejectionReason = Array.isArray(data?.rejectedSamples)
        ? data.rejectedSamples[0]?.reason
        : null;
      throw new Error(rejectionReason || "Transactional SMS was rejected");
    }
    return data;
  } catch (err) {
    throw new Error(parseAxiosError(err));
  }
};

export const sendOtpSMS = async (phoneNumber, otp) => {
  requireApiKey();
  const otpValue = otp ? String(otp) : null;

  // Prefer transactional SMS for OTP delivery so users receive an SMS message
  // instead of provider-managed fallback channels like voice calls.
  if (otpValue) {
    return sendTransactionalSms(
      phoneNumber,
      `Your Verdora OTP is ${otpValue}. It is valid for 10 minutes. Do not share this code with anyone.`,
    );
  }

  const normalized = normalizePhoneNumber(phoneNumber);

  try {
    const response = await axios.post(
      `${OTP_BASE_URL}/${API_KEY}/SMS/${normalized.withoutPlus}/AUTOGEN`,
    );
    const data = parseResponseData(response.data);
    assertSuccess(data, "Failed to send OTP");
    return data;
  } catch (err) {
    throw new Error(parseAxiosError(err));
  }
};

export const verifyOtp = async (phoneNumber, otp) => {
  requireApiKey();
  if (!otp) {
    throw new Error("OTP is required");
  }

  const normalized = normalizePhoneNumber(phoneNumber);

  try {
    const response = await axios.get(
      `${OTP_BASE_URL}/${API_KEY}/SMS/VERIFY3/${normalized.withoutPlus}/${encodeURIComponent(String(otp))}`,
    );
    const data = parseResponseData(response.data);
    const details = String(data?.Details || "").toLowerCase();
    const matched =
      details.includes("otp matched") ||
      (String(data?.Status || "").toLowerCase() === "success" &&
        !details.includes("mismatch"));

    return {
      matched,
      data,
    };
  } catch (err) {
    throw new Error(parseAxiosError(err));
  }
};

export const sendWelcomeSMS = async (phoneNumber, userName) =>
  sendTransactionalSms(
    phoneNumber,
    `Welcome to Verdora, ${userName}! Browse plants and gardening products at https://verdora.com`,
  );

export const sendOrderConfirmationSMS = async (phoneNumber, orderId, total) =>
  sendTransactionalSms(
    phoneNumber,
    `Your Verdora order #${String(orderId || "").slice(-6)} confirmed! Total: Rs.${Number(total || 0).toFixed(2)}. Track at https://verdora.com/orders`,
  );

export const sendOrderShippedSMS = async (
  phoneNumber,
  orderId,
  estimatedDelivery,
) =>
  sendTransactionalSms(
    phoneNumber,
    `Your Verdora order #${String(orderId || "").slice(-6)} has shipped. Est. delivery: ${estimatedDelivery || "2-5 days"}. Track at https://verdora.com/orders`,
  );

export const sendOrderDeliveredSMS = async (phoneNumber, orderId) =>
  sendTransactionalSms(
    phoneNumber,
    `Your Verdora order #${String(orderId || "").slice(-6)} was delivered. Please review it at https://verdora.com/orders`,
  );

export const sendOrderCancelledSMS = async (phoneNumber, orderId) =>
  sendTransactionalSms(
    phoneNumber,
    `Your Verdora order #${String(orderId || "").slice(-6)} has been cancelled. Refund will be processed in 5-7 days.`,
  );

export const sendReturnRequestSMS = async (phoneNumber, orderId, returnType) => {
  const typeLabel = returnType === "returned" ? "Return" : "Replacement";
  return sendTransactionalSms(
    phoneNumber,
    `${typeLabel} request received for order #${String(orderId || "").slice(-6)}. We are reviewing it and will update you soon.`,
  );
};

export const sendOrderStatusUpdateSMS = async (phoneNumber, orderId, status) => {
  const statusMessage = ORDER_STATUS_MESSAGES[status] || "Your order status was updated.";
  return sendTransactionalSms(
    phoneNumber,
    `${statusMessage} Order #${String(orderId || "").slice(-6)}. Details: https://verdora.com/orders`,
  );
};

export const sendRefundProcessedSMS = async (
  phoneNumber,
  orderId,
  refundAmount,
) =>
  sendTransactionalSms(
    phoneNumber,
    `Refund of Rs.${Number(refundAmount || 0).toFixed(2)} for order #${String(orderId || "").slice(-6)} is processed. It should reflect in 5-7 days.`,
  );

export const sendVendorRegistrationReceivedSMS = async (phoneNumber, vendorName) =>
  sendTransactionalSms(
    phoneNumber,
    `Hi ${vendorName}, your Verdora vendor application is received. We will review and contact you in 3-5 days.`,
  );

export const sendVendorApprovedSMS = async (phoneNumber, vendorName) =>
  sendTransactionalSms(
    phoneNumber,
    `Congratulations ${vendorName}! Your Verdora vendor application is approved. Login at https://verdora.com/vendor/login`,
  );

export const sendVendorRejectedSMS = async (phoneNumber, vendorName) =>
  sendTransactionalSms(
    phoneNumber,
    `Hi ${vendorName}, your Verdora vendor application was not approved this time. Please check your email for details.`,
  );

export const getSmsServiceStatus = async () => {
  if (!API_KEY) {
    return {
      status: "Not Configured",
      configured: false,
      message: "TWO_FACTOR_API_KEY is missing",
    };
  }

  return {
    status: "Configured",
    configured: true,
    message: "2Factor SMS service is configured",
    apiKey: `${API_KEY.slice(0, 8)}****`,
  };
};
