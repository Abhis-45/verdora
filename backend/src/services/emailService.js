import nodemailer from "nodemailer";
import dns from "dns";
import dotenv from "dotenv";

dotenv.config();

const dnsPromises = dns.promises;

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.hostinger.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_USER = process.env.EMAIL_USER || "support@verdora.in";
const EMAIL_PASS = process.env.EMAIL_PASS || undefined;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || undefined;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatItems = (items = []) => {
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) return "<p>No item details provided.</p>";

  return `
    <ul>
      ${safeItems
        .map(
          (item) =>
            `<li>${escapeHtml(item.title || item.name || "Item")} x ${escapeHtml(
              item.quantity || 1,
            )}</li>`,
        )
        .join("")}
    </ul>
  `;
};

const buildTransporterConfig = async (overrides = {}) => {
  let resolvedHost = EMAIL_HOST;

  if (!EMAIL_SERVICE) {
    try {
      const addresses = await dnsPromises.lookup(EMAIL_HOST, { family: 4, all: true });
      if (addresses?.length) {
        resolvedHost = addresses[0].address;
      }
    } catch (_err) {
      resolvedHost = EMAIL_HOST;
    }
  }

  return {
    host: resolvedHost,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    authMethod: "LOGIN",
    requireTLS: EMAIL_PORT !== 465,
    tls: {
      servername: EMAIL_HOST,
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
      ciphers: "HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback),
    ...overrides,
  };
};

const createTransporter = async (overrides = {}) =>
  nodemailer.createTransport(await buildTransporterConfig(overrides));

const requireEmailConfig = () => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }
};

export const verifyEmailTransporter = async () => {
  try {
    requireEmailConfig();
    console.log("Verifying email transporter with config:", {
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      user: EMAIL_USER,
      from: EMAIL_FROM,
      env: process.env.NODE_ENV,
    });
    const transporter = await createTransporter();
    await transporter.verify();
    transporter.close();
    console.log("Email transporter verification successful");
    return true;
  } catch (err) {
    console.error("Email transporter verification failed:", {
      message: err.message,
      code: err.code,
      command: err.command,
      stack: err.stack,
    });
    return false;
  }
};

const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  requireEmailConfig();
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const transporter = await createTransporter();
      const result = await transporter.sendMail({
        from: EMAIL_FROM,
        ...mailOptions,
      });
      transporter.close();
      return result;
    } catch (err) {
      lastError = err;
      console.error(`Email send attempt ${attempt} failed:`, {
        message: err.message,
        code: err.code,
        command: err.command,
      });

      if (attempt < maxRetries) {
        const delay = attempt * 2000;
        console.log(`Retrying email send in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError?.message || "unknown error"}`);
};

const layout = (title, body) => `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#1f2937;line-height:1.6">
    <h2 style="color:#16a34a;margin-bottom:16px">${escapeHtml(title)}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
    <p style="font-size:12px;color:#6b7280">Verdora Support: support@verdora.in</p>
  </div>
`;

export const sendOtpEmail = async (email, otp) =>
  sendEmailWithRetry({
    to: email,
    subject: "Your Verdora OTP",
    html: layout(
      "Verdora Verification Code",
      `
        <p>Your one-time password is:</p>
        <p style="font-size:32px;font-weight:700;color:#16a34a;letter-spacing:4px">${escapeHtml(otp)}</p>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    ),
  });

export const sendWelcomeEmail = async (email, name = "Guest") =>
  sendEmailWithRetry({
    to: email,
    subject: "Welcome to Verdora",
    html: layout(
      `Welcome to Verdora, ${name}`,
      `
        <p>Your account is active and ready to use.</p>
        <p>We are happy to help you grow a greener home.</p>
      `,
    ),
  });

export const sendAccountDeletedEmail = async (email, name = "Customer") =>
  sendEmailWithRetry({
    to: email,
    subject: "Account Deleted - Verdora",
    html: layout(
      "Account Deleted",
      `
        <p>Dear ${escapeHtml(name)},</p>
        <p>Your Verdora account has been deleted as requested.</p>
      `,
    ),
  });

export const sendVendorOrderNotificationEmail = async (
  email,
  vendorNameOrDetails,
  orderId,
  customerName,
  customerContact,
  address,
  items,
  total,
) => {
  const details =
    typeof vendorNameOrDetails === "object"
      ? vendorNameOrDetails
      : {
          vendorName: vendorNameOrDetails,
          orderId,
          customerName,
          customerContact,
          address,
          items,
          total,
        };

  return sendEmailWithRetry({
    to: email,
    subject: `New Order #${details.orderId || ""} - Verdora`,
    html: layout(
      "New Order Received",
      `
        <p>Dear ${escapeHtml(details.vendorName || "Vendor")},</p>
        <p>You have received a new order.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(details.orderId || "N/A")}</p>
        <p><strong>Customer:</strong> ${escapeHtml(details.customerName || "Customer")}</p>
        <p><strong>Total:</strong> ${formatCurrency(details.total)}</p>
        ${formatItems(details.items)}
      `,
    ),
  });
};

export const sendUserOrderConfirmationEmail = async (
  email,
  nameOrDetails,
  orderId,
  items,
  address,
  total,
  estimatedDelivery,
) => {
  const details =
    typeof nameOrDetails === "object"
      ? nameOrDetails
      : { name: nameOrDetails, orderId, items, address, total, estimatedDelivery };

  return sendEmailWithRetry({
    to: email,
    subject: `Order Confirmed #${details.orderId || ""} - Verdora`,
    html: layout(
      "Order Confirmed",
      `
        <p>Dear ${escapeHtml(details.name || "Customer")},</p>
        <p>Thank you for your order.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(details.orderId || "N/A")}</p>
        <p><strong>Total:</strong> ${formatCurrency(details.total)}</p>
        <p><strong>Estimated delivery:</strong> ${escapeHtml(details.estimatedDelivery || "We will update you soon")}</p>
        ${formatItems(details.items)}
      `,
    ),
  });
};

export const sendOrderStatusUpdateEmail = async (email, orderDetails = {}) =>
  sendEmailWithRetry({
    to: email,
    subject: `Order Status Update #${orderDetails.orderId || ""} - Verdora`,
    html: layout(
      "Order Status Update",
      `
        <p>Your order status has changed.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(orderDetails.orderId || "N/A")}</p>
        <p><strong>Status:</strong> ${escapeHtml(orderDetails.status || "Updated")}</p>
      `,
    ),
  });

export const sendUserReturnRequestEmail = async (
  email,
  nameOrDetails,
  orderId,
  productName,
  action,
) => {
  const details =
    typeof nameOrDetails === "object"
      ? nameOrDetails
      : { name: nameOrDetails, orderId, productName, action };

  return sendEmailWithRetry({
    to: email,
    subject: `Return Request #${details.orderId || ""} - Verdora`,
    html: layout(
      "Return Request Received",
      `
        <p>Dear ${escapeHtml(details.name || "Customer")},</p>
        <p>Your ${escapeHtml(details.action || "return")} request has been received.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(details.orderId || "N/A")}</p>
        <p><strong>Item:</strong> ${escapeHtml(details.productName || details.reason || "N/A")}</p>
      `,
    ),
  });
};

export const sendUserOrderCancelledEmail = async (email, nameOrDetails, orderId) => {
  const details =
    typeof nameOrDetails === "object" ? nameOrDetails : { name: nameOrDetails, orderId };

  return sendEmailWithRetry({
    to: email,
    subject: `Order Cancelled #${details.orderId || ""} - Verdora`,
    html: layout(
      "Order Cancelled",
      `
        <p>Dear ${escapeHtml(details.name || "Customer")},</p>
        <p>Your order has been cancelled.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(details.orderId || "N/A")}</p>
      `,
    ),
  });
};

export const sendServiceBookingConfirmationEmail = async (
  email,
  nameOrDetails,
  serviceSlug,
  packageName,
  selectedDate,
  selectedTime,
  price,
  message,
) => {
  const details =
    typeof nameOrDetails === "object"
      ? nameOrDetails
      : { name: nameOrDetails, serviceSlug, packageName, selectedDate, selectedTime, price, message };

  return sendEmailWithRetry({
    to: email,
    subject: "Service Booking Confirmed - Verdora",
    html: layout(
      "Service Booking Confirmed",
      `
        <p>Dear ${escapeHtml(details.name || "Customer")},</p>
        <p>Your service booking has been received.</p>
        <p><strong>Service:</strong> ${escapeHtml(details.packageName || details.serviceName || details.serviceSlug || "Service")}</p>
        <p><strong>Date:</strong> ${escapeHtml(details.selectedDate || details.date || "To be confirmed")}</p>
        <p><strong>Time:</strong> ${escapeHtml(details.selectedTime || details.time || "To be confirmed")}</p>
        <p><strong>Price:</strong> ${formatCurrency(details.price)}</p>
      `,
    ),
  });
};

export const sendAdminContactNotificationEmail = async (adminEmail, contactData = {}) =>
  sendEmailWithRetry({
    to: adminEmail,
    subject: "New Contact Form Submission - Verdora",
    html: layout(
      "New Contact Form Submission",
      `
        <p><strong>Name:</strong> ${escapeHtml(contactData.name || "N/A")}</p>
        <p><strong>Email:</strong> ${escapeHtml(contactData.email || "N/A")}</p>
        <p><strong>Phone:</strong> ${escapeHtml(contactData.phone || "Not provided")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(contactData.message || "")}</p>
      `,
    ),
  });

export const sendContactEmail = async (email, nameOrData = "Customer") => {
  const details =
    typeof nameOrData === "object" ? nameOrData : { name: nameOrData };

  return sendEmailWithRetry({
    to: email,
    subject: "Thank you for contacting Verdora",
    html: layout(
      "Thank you for contacting us",
      `
        <p>Dear ${escapeHtml(details.name || "Customer")},</p>
        <p>We have received your message and will get back to you soon.</p>
      `,
    ),
  });
};

export const sendSubscriptionEmail = async (email, name = "Subscriber") =>
  sendEmailWithRetry({
    to: email,
    subject: "Welcome to Verdora Newsletter",
    html: layout(
      "Welcome to our Newsletter",
      `
        <p>Dear ${escapeHtml(name || "Subscriber")},</p>
        <p>Thank you for subscribing to Verdora updates.</p>
      `,
    ),
  });

export const sendNewsletterSubscriptionEmail = sendSubscriptionEmail;
export const sendContactFormEmail = sendContactEmail;

export const sendVendorRegistrationSubmittedEmail = async (
  vendorEmail,
  nameOrData,
  shopName,
) => {
  const details =
    typeof nameOrData === "object"
      ? nameOrData
      : { name: nameOrData, businessName: shopName, applicationId: "" };

  return sendEmailWithRetry({
    to: vendorEmail,
    subject: "Vendor Application Received - Verdora",
    html: layout(
      "Vendor Application Received",
      `
        <p>Dear ${escapeHtml(details.name || details.vendorName || "Vendor")},</p>
        <p>Your vendor application${details.businessName ? ` for ${escapeHtml(details.businessName)}` : ""} has been received.</p>
        <p>We will review it and contact you by email.</p>
      `,
    ),
  });
};

export const sendVendorApplicationEmail = sendVendorRegistrationSubmittedEmail;

export const sendVendorApprovalEmail = async (
  vendorEmail,
  nameOrData,
  businessName,
  loginUrl,
) => {
  const details =
    typeof nameOrData === "object"
      ? nameOrData
      : { name: nameOrData, businessName, loginUrl };

  return sendEmailWithRetry({
    to: vendorEmail,
    subject: "Vendor Application Approved - Verdora",
    html: layout(
      "Application Approved",
      `
        <p>Dear ${escapeHtml(details.name || "Vendor")},</p>
        <p>Your vendor application${details.businessName ? ` for ${escapeHtml(details.businessName)}` : ""} has been approved.</p>
        <p>You can log in here: ${escapeHtml(details.loginUrl || "https://verdora.in/vendor/login")}</p>
      `,
    ),
  });
};

export const sendVendorRejectionEmail = async (
  vendorEmail,
  nameOrData,
  businessName,
  reason,
) => {
  const details =
    typeof nameOrData === "object"
      ? nameOrData
      : { name: nameOrData, businessName, reason };

  return sendEmailWithRetry({
    to: vendorEmail,
    subject: "Vendor Application Status - Verdora",
    html: layout(
      "Application Status Update",
      `
        <p>Dear ${escapeHtml(details.name || "Vendor")},</p>
        <p>Your vendor application${details.businessName ? ` for ${escapeHtml(details.businessName)}` : ""} could not be approved at this time.</p>
        <p><strong>Reason:</strong> ${escapeHtml(details.reason || "Please contact support for more information.")}</p>
      `,
    ),
  });
};

export const sendVendorApprovedEmail = sendVendorApprovalEmail;
export const sendVendorRejectedEmail = sendVendorRejectionEmail;

export const sendUserOrderShippedEmail = async (
  email,
  nameOrDetails,
  orderId,
  trackingNumber,
  estimatedDelivery,
) => {
  const details =
    typeof nameOrDetails === "object"
      ? nameOrDetails
      : { name: nameOrDetails, orderId, trackingNumber, estimatedDelivery };

  return sendEmailWithRetry({
    to: email,
    subject: `Order Shipped #${details.orderId || ""} - Verdora`,
    html: layout(
      "Your Order Has Shipped",
      `
        <p>Dear ${escapeHtml(details.name || "Customer")},</p>
        <p>Your order is on the way.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(details.orderId || "N/A")}</p>
        <p><strong>Tracking:</strong> ${escapeHtml(details.trackingNumber || "Will be provided soon")}</p>
        <p><strong>Estimated delivery:</strong> ${escapeHtml(details.estimatedDelivery || "2-5 business days")}</p>
      `,
    ),
  });
};

export const sendUserOrderDeliveredEmail = async (email, nameOrDetails, orderId) => {
  const details =
    typeof nameOrDetails === "object" ? nameOrDetails : { name: nameOrDetails, orderId };

  return sendEmailWithRetry({
    to: email,
    subject: `Order Delivered #${details.orderId || ""} - Verdora`,
    html: layout(
      "Your Order Has Been Delivered",
      `
        <p>Dear ${escapeHtml(details.name || "Customer")},</p>
        <p>Your order has been delivered.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(details.orderId || "N/A")}</p>
      `,
    ),
  });
};

export const sendUserOrderOutForDeliveryEmail = async (email, orderDetails = {}) =>
  sendEmailWithRetry({
    to: email,
    subject: `Order Out for Delivery #${orderDetails.orderId || ""} - Verdora`,
    html: layout(
      "Order Out for Delivery",
      `<p>Your order is out for delivery today.</p>`,
    ),
  });

export const sendUserOrderReturnedEmail = async (email, orderDetails = {}) =>
  sendEmailWithRetry({
    to: email,
    subject: `Return Processed #${orderDetails.orderId || ""} - Verdora`,
    html: layout(
      "Return Processed",
      `<p>Your return request has been processed.</p>`,
    ),
  });

export const sendUserOrderRefundedEmail = async (
  email,
  nameOrDetails,
  orderId,
  refundAmount,
) => {
  const details =
    typeof nameOrDetails === "object"
      ? nameOrDetails
      : { name: nameOrDetails, orderId, refundAmount };

  return sendEmailWithRetry({
    to: email,
    subject: `Refund Processed #${details.orderId || ""} - Verdora`,
    html: layout(
      "Refund Processed",
      `
        <p>Dear ${escapeHtml(details.name || "Customer")},</p>
        <p>Your refund has been processed.</p>
        <p><strong>Order ID:</strong> ${escapeHtml(details.orderId || "N/A")}</p>
        <p><strong>Refund Amount:</strong> ${formatCurrency(details.refundAmount)}</p>
      `,
    ),
  });
};

export const sendUserRefundProcessedEmail = sendUserOrderRefundedEmail;

export const sendVendorReadyToShipEmail = async (
  vendorEmail,
  nameOrDetails,
  orderId,
  customerName,
  items,
  date,
) => {
  const details =
    typeof nameOrDetails === "object"
      ? nameOrDetails
      : { name: nameOrDetails, orderId, customerName, items, date };

  return sendEmailWithRetry({
    to: vendorEmail,
    subject: `Order Ready to Ship #${details.orderId || ""} - Verdora`,
    html: layout(
      "Order Ready to Ship",
      `
        <p>Dear ${escapeHtml(details.name || "Vendor")},</p>
        <p>Order #${escapeHtml(details.orderId || "N/A")} is ready to ship.</p>
        <p><strong>Customer:</strong> ${escapeHtml(details.customerName || "Customer")}</p>
        ${formatItems(details.items)}
      `,
    ),
  });
};

export const sendVendorOrderShippedEmail = async (
  vendorEmail,
  nameOrDetails,
  orderId,
  customerName,
  items,
) => {
  const details =
    typeof nameOrDetails === "object"
      ? nameOrDetails
      : { name: nameOrDetails, orderId, customerName, items };

  return sendEmailWithRetry({
    to: vendorEmail,
    subject: `Order Shipped Confirmation #${details.orderId || ""} - Verdora`,
    html: layout(
      "Order Shipped",
      `
        <p>Dear ${escapeHtml(details.name || "Vendor")},</p>
        <p>Order #${escapeHtml(details.orderId || "N/A")} has been marked shipped.</p>
        <p><strong>Customer:</strong> ${escapeHtml(details.customerName || "Customer")}</p>
        ${formatItems(details.items)}
      `,
    ),
  });
};

export default {
  sendOtpEmail,
  sendWelcomeEmail,
  sendAccountDeletedEmail,
  sendVendorOrderNotificationEmail,
  sendUserOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendUserReturnRequestEmail,
  sendUserOrderCancelledEmail,
  sendServiceBookingConfirmationEmail,
  sendAdminContactNotificationEmail,
  sendContactEmail,
  sendContactFormEmail,
  sendSubscriptionEmail,
  sendNewsletterSubscriptionEmail,
  sendVendorRegistrationSubmittedEmail,
  sendVendorApplicationEmail,
  sendVendorApprovalEmail,
  sendVendorApprovedEmail,
  sendVendorRejectedEmail,
  sendVendorRejectionEmail,
  sendVendorReadyToShipEmail,
  sendVendorOrderShippedEmail,
  sendUserOrderShippedEmail,
  sendUserOrderDeliveredEmail,
  sendUserOrderOutForDeliveryEmail,
  sendUserOrderReturnedEmail,
  sendUserOrderRefundedEmail,
  sendUserRefundProcessedEmail,
  verifyEmailTransporter,
};
