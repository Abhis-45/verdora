import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;
const TWO_FACTOR_SENDER_ID = process.env.TWO_FACTOR_SENDER_ID || "VERDORA";
const OTP_TEMPLATE = process.env.TWO_FACTOR_TEMPLATE || process.env.TWO_FACTOR_OTP_TEMPLATE || "OTP1";
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_SENDER_ID = process.env.FAST2SMS_SENDER_ID || "FSTSMS";
const SMS_PROVIDER = (process.env.SMS_PROVIDER || "2factor").toLowerCase();

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) throw new Error("Phone number is required");

  let cleaned = String(phoneNumber).trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = `91${cleaned.slice(1)}`;
  }

  return `+${cleaned}`;
};

const formatPhoneDigits = (phoneNumber) => {
  return formatPhoneNumber(phoneNumber).replace(/^\+/, "");
};

const validate2FactorConfig = () => {
  if (!TWO_FACTOR_API_KEY) {
    throw new Error("2Factor API key is not configured");
  }
};

const validateFast2SmsConfig = () => {
  if (!FAST2SMS_API_KEY) {
    throw new Error("Fast2SMS API key is not configured");
  }
};

const sendSmsVia2Factor = async (phoneNumber, userName = "User") => {
  validate2FactorConfig();

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const apiUrl = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${formattedPhone}/AUTOGEN/${OTP_TEMPLATE}`;

  console.log(`\n📲 [2Factor SMS] Sending OTP to ${formattedPhone}`);
  console.log(`🔗 API URL: ${apiUrl.replace(TWO_FACTOR_API_KEY, "XXXX-XXXX-XXXX-XXXX-XXXX")}`);
  console.log(`🔧 OTP Template: ${OTP_TEMPLATE}`);

  const response = await axios.get(apiUrl, {
    timeout: 10000,
    validateStatus: () => true,
  });

  console.log(`📤 2Factor Response Status: ${response.status}`);
  console.log(`📤 2Factor Response Data:`, JSON.stringify(response.data));

  const data = response.data;
  if (data?.Status === "Success") {
    return {
      provider: "2factor",
      success: true,
      apiResponse: data,
      phoneNumber: formattedPhone,
      sessionId: data?.Details,
      otp: data?.OTP || null,
    };
  }

  const errorMsg = data?.Details || `2Factor returned non-success status ${data?.Status}`;
  throw new Error(errorMsg);
};

const sendSmsViaFast2Sms = async (phoneNumber, message) => {
  validateFast2SmsConfig();

  const digits = formatPhoneDigits(phoneNumber);
  const encodedMessage = encodeURIComponent(String(message || "").slice(0, 140));
  const apiUrl = `https://www.fast2sms.com/dev/bulk?authorization=${FAST2SMS_API_KEY}&sender_id=${FAST2SMS_SENDER_ID}&message=${encodedMessage}&language=english&route=p&numbers=${digits}`;

  console.log(`\n📲 [Fast2SMS] Sending SMS to ${digits}`);
  console.log(`🔗 API URL: ${apiUrl.replace(FAST2SMS_API_KEY, "XXXX-XXXX-XXXX-XXXX-XXXX")}`);

  const response = await axios.get(apiUrl, {
    timeout: 15000,
    validateStatus: () => true,
  });

  console.log(`📤 Fast2SMS Response Status: ${response.status}`);
  console.log(`📤 Fast2SMS Response Data:`, JSON.stringify(response.data));

  const data = response.data;
  if (data?.return === true || data?.Return === true || String(data?.return).toLowerCase() === "true") {
    return {
      provider: "fast2sms",
      success: true,
      apiResponse: data,
      phoneNumber: `+${digits}`,
    };
  }

  const errorMsg = data?.message || data?.error || "Fast2SMS returned failure";
  throw new Error(errorMsg);
};

export const sendOtpSMS = async (phoneNumber, otp, userName = "User") => {
  const providers = [];
  const otpValue = otp || null;

  if (SMS_PROVIDER === "fast2sms") {
    providers.push(async (phone, _message) => {
      const generatedOtp = otpValue || generateSixDigitOtp();
      const message = `Hi ${userName}, Your one time password for phone verification is ${generatedOtp}. Please do not share OTP with anyone.`;
      const result = await sendSmsViaFast2Sms(phone, message);
      return {
        ...result,
        otp: generatedOtp,
      };
    });
    if (TWO_FACTOR_API_KEY) providers.push(sendSmsVia2Factor);
  } else {
    if (TWO_FACTOR_API_KEY) providers.push(sendSmsVia2Factor);
    if (FAST2SMS_API_KEY) providers.push(async (phone, _message) => {
      const generatedOtp = otpValue || generateSixDigitOtp();
      const message = `Hi ${userName}, Your one time password for phone verification is ${generatedOtp}. Please do not share OTP with anyone.`;
      const result = await sendSmsViaFast2Sms(phone, message);
      return {
        ...result,
        otp: generatedOtp,
      };
    });
  }

  if (providers.length === 0) {
    throw new Error("No SMS provider is configured. Set TWO_FACTOR_API_KEY or FAST2SMS_API_KEY.");
  }

  let lastError = null;
  for (const providerFn of providers) {
    try {
      const result = await providerFn(phoneNumber, userName);
      return {
        success: true,
        provider: result.provider,
        phoneNumber: result.phoneNumber,
        apiResponse: result.apiResponse,
        sessionId: result.sessionId,
        otp: result.otp || null,
      };
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ SMS provider failed: ${error.message}`);
    }
  }

  throw new Error(`SMS API Error: All providers failed. Last error: ${lastError?.message}`);
};

const generateSixDigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const verifyOtp = async (sessionId, otp) => {
  validate2FactorConfig();

  if (!sessionId || !otp) {
    throw new Error("Session ID and OTP are required for verification.");
  }

  const apiUrl = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${String(otp).trim()}`;

  console.log(`\n🔐 [2Factor Verify] Verifying OTP using session ${sessionId}`);
  console.log(`🔗 API URL: ${apiUrl.replace(TWO_FACTOR_API_KEY, "XXXX-XXXX-XXXX-XXXX-XXXX")}`);

  const response = await axios.get(apiUrl, {
    timeout: 10000,
    validateStatus: () => true,
  });

  console.log(`📤 2Factor Verify Response Status: ${response.status}`);
  console.log(`📤 2Factor Verify Response Data:`, JSON.stringify(response.data));

  const data = response.data;
  const matched = data?.Status === "Success" && data?.Details?.toLowerCase?.().includes("otp matched");
  return {
    success: matched,
    matched,
    apiResponse: data,
  };
};

export const verifyOtpByPhone = async (phoneNumber, otp) => {
  validate2FactorConfig();

  if (!phoneNumber || !otp) {
    throw new Error("Phone number and OTP are required for phone verification.");
  }

  const formattedPhone = formatPhoneDigits(phoneNumber);
  const apiUrl = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY3/${formattedPhone}/${String(otp).trim()}`;

  console.log(`\n🔐 [2Factor Verify] Verifying OTP using phone ${formattedPhone}`);
  console.log(`🔗 API URL: ${apiUrl.replace(TWO_FACTOR_API_KEY, "XXXX-XXXX-XXXX-XXXX-XXXX")}`);

  const response = await axios.get(apiUrl, {
    timeout: 10000,
    validateStatus: () => true,
  });

  console.log(`📤 2Factor Verify3 Response Status: ${response.status}`);
  console.log(`📤 2Factor Verify3 Response Data:`, JSON.stringify(response.data));

  const data = response.data;
  const matched = data?.Status === "Success" && data?.Details?.toLowerCase?.().includes("otp matched");
  return {
    success: matched,
    matched,
    apiResponse: data,
  };
};

const sendTransactionalSms = async (phoneNumber, message) => {
  validate2FactorConfig();

  const formattedPhone = formatPhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(String(message || "").slice(0, 140));
  const apiUrl = `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${formattedPhone}/${Date.now()}/${OTP_TEMPLATE}`;

  console.log(`\n📱 [Transactional SMS] Sending to ${formattedPhone}`);

  const response = await axios.get(apiUrl, {
    timeout: 15000,
    validateStatus: () => true,
  });

  const data = response.data;
  if (data?.Status === "Success") {
    return data;
  }

  const errorMsg = data?.Details || "API returned error";
  throw new Error(errorMsg);
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

export const sendWelcomeSMS = async (phoneNumber, name = "Customer") => {
  const message = `Hello ${name}, welcome to Verdora! Your account is now active and ready to use.`;
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
