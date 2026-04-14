// services/twilioService.js
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

export const sendOtpSMS = async (phoneNumber, otp) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error(
      "Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)",
    );
  }

  try {
    return await client.messages.create({
      body: `Your Verdora OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND WELCOME SMS
export const sendWelcomeSMS = async (phoneNumber, userName) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }
  
  try {
    return await client.messages.create({
      body: `Welcome to Verdora, ${userName}! 🌿 Browse plants & gardening products. Start shopping now: https://verdora.com`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND ORDER CONFIRMATION SMS
export const sendOrderConfirmationSMS = async (
  phoneNumber,
  orderId,
  total
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    return await client.messages.create({
      body: `Your Verdora order #${orderId.slice(-6)} confirmed! Total: ₹${total.toFixed(2)}. Track at: https://verdora.com/orders`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND ORDER SHIPPED SMS
export const sendOrderShippedSMS = async (
  phoneNumber,
  orderId,
  estimatedDelivery
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    return await client.messages.create({
      body: `🚚 Your Verdora order #${orderId.slice(-6)} has shipped! Est. delivery: ${estimatedDelivery || "2-5 days"}. Track: https://verdora.com/orders`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND ORDER DELIVERED SMS
export const sendOrderDeliveredSMS = async (
  phoneNumber,
  orderId
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    return await client.messages.create({
      body: `✓ Your Verdora order #${orderId.slice(-6)} delivered! Please write a review and help others. https://verdora.com/orders`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND ORDER CANCELLED SMS
export const sendOrderCancelledSMS = async (
  phoneNumber,
  orderId
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    return await client.messages.create({
      body: `Your Verdora order #${orderId.slice(-6)} has been cancelled. Refund will be processed in 5-7 days.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND RETURN REQUEST SMS
export const sendReturnRequestSMS = async (
  phoneNumber,
  orderId,
  returnType
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    const typeLabel = returnType === 'returned' ? '↩️ Return' : '🔄 Replacement';
    return await client.messages.create({
      body: `${typeLabel} request received for order #${orderId.slice(-6)}. We're reviewing it. Check email for updates.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND REFUND PROCESSED SMS
export const sendRefundProcessedSMS = async (
  phoneNumber,
  orderId,
  refundAmount
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    return await client.messages.create({
      body: `💰 Refund of ₹${refundAmount.toFixed(2)} for order #${orderId.slice(-6)} processed. Check your account in 5-7 days.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND VENDOR REGISTRATION RECEIVED SMS
export const sendVendorRegistrationReceivedSMS = async (
  phoneNumber,
  vendorName
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    return await client.messages.create({
      body: `Hi ${vendorName}, your Verdora vendor application has been received! We'll review it and contact you within 3-5 days.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND VENDOR APPROVED SMS
export const sendVendorApprovedSMS = async (
  phoneNumber,
  vendorName
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    return await client.messages.create({
      body: `🎉 Congratulations ${vendorName}! Your Verdora vendor application is approved. Login now: https://verdora.com/vendor/login`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ SEND VENDOR REJECTED SMS
export const sendVendorRejectedSMS = async (
  phoneNumber,
  vendorName
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    return await client.messages.create({
      body: `Hi ${vendorName}, your Verdora vendor application was not approved at this time. Check email for details. Contact: support@verdora.com`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};

// ✅ GENERIC ORDER STATUS UPDATE SMS
export const sendOrderStatusUpdateSMS = async (
  phoneNumber,
  orderId,
  status
) => {
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Phone number must be in E.164 format (e.g. +91XXXXXXXXXX)");
  }

  try {
    const statusMessages = {
      'shipped': '🚚 Your order has shipped!',
      'delivered': '✓ Your order is delivered!',
      'returned': '↩️ Return request received.',
      'replaced': '🔄 Replacement being processed.',
      'refunded': '💰 Refund processed.',
      'cancelled': '❌ Order cancelled.'
    };

    const message = statusMessages[status] || '📦 Your order status updated.';
    
    return await client.messages.create({
      body: `${message} Order #${orderId.slice(-6)}. Details: https://verdora.com/orders`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (err) {
    throw err;
  }
};
