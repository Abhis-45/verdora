import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Hostinger SMTP Configuration with support@verdora.in
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtpro.verdora.in",
  port: process.env.EMAIL_PORT || 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER || "support@verdora.in",
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  family: 4,
  connectionTimeout: 30000,
  socketTimeout: 30000,
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// ✅ Fallback transporter with alternative settings
const fallbackTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtpro.verdora.in",
  port: process.env.EMAIL_PORT_ALT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || "support@verdora.in",
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  family: 4,
  connectionTimeout: 30000,
  socketTimeout: 30000,
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// ✅ Verify transporter on startup
export const verifyEmailTransporter = async () => {
  console.log("🔍 Verifying Hostinger email transporter (support@verdora.in)...");

  // Test primary transporter (port 465 SSL)
  try {
    await transporter.verify();
    console.log("✅ Primary email transporter verified successfully (Port 465 SSL - Hostinger)");
  } catch (err) {
    console.error("❌ Primary email transporter verification failed:", err.message);
  }

  // Test fallback transporter (port 587)
  try {
    await fallbackTransporter.verify();
    console.log("✅ Fallback email transporter verified successfully (Port 587 STARTTLS - Hostinger)");
  } catch (err) {
    console.error("❌ Fallback email transporter verification failed:", err.message);
  }

  console.log("📧 Email Configuration: support@verdora.in via Hostinger SMTP");

  return true;
};
// ✅ Generic email send helper with retry logic and fallback transporter
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  let lastError;

  // Set default 'from' if not specified
  if (!mailOptions.from) {
    mailOptions.from = process.env.EMAIL_FROM || "support@verdora.in";
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // On the last attempt, try the fallback transporter (port 587)
      const currentTransporter = attempt === maxRetries ? fallbackTransporter : transporter;
      const portInfo = attempt === maxRetries ? '587 (STARTTLS)' : '465 (SSL)';

      const result = await currentTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to} using port ${portInfo} (Attempt ${attempt})`);
      return result;
    } catch (err) {
      lastError = err;
      const portInfo = attempt === maxRetries ? '587 (STARTTLS)' : '465 (SSL)';
      console.error(`❌ Attempt ${attempt} failed for ${mailOptions.to} using port ${portInfo}:`, err.message);

      if (attempt < maxRetries) {
        const delay = 1000 * attempt;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
};

// ✅ Helper functions for email formatting
const escapeHtml = (text) => {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (char) => map[char]);
};

const formatCurrency = (amount) => {
  if (!amount) return "₹0.00";
  return `₹${Number(amount).toFixed(2)}`;
};

const formatItems = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return "";
  
  const itemsList = items
    .map(
      (item) =>
        `<tr>
          <td>${escapeHtml(item.productName || item.name || "Item")}</td>
          <td>Qty: ${item.quantity || 1}</td>
          <td>${formatCurrency(item.price || item.productPrice)}</td>
        </tr>`
    )
    .join("");

  return `<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
    <thead style="background-color: #f0f0f0;">
      <tr>
        <th style="text-align: left; padding: 8px;">Product</th>
        <th style="text-align: left; padding: 8px;">Quantity</th>
        <th style="text-align: right; padding: 8px;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemsList}
    </tbody>
  </table>`;
};

const layout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
    .header { background-color: #22c55e; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background-color: white; padding: 20px; border-radius: 5px; border: 1px solid #e0e0e0; margin-bottom: 20px; }
    .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #f0f0f0; padding: 10px; text-align: left; font-weight: bold; }
    td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
    a { color: #22c55e; text-decoration: none; }
    .button { display: inline-block; background-color: #22c55e; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verdora</h1>
      <p>${escapeHtml(title)}</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 Verdora. All rights reserved.</p>
      <p>If you have any questions, contact us at support@verdora.in</p>
    </div>
  </div>
</body>
</html>
`;

// ✅ Send OTP for verification with retry logic
export const sendOtpEmail = async (email, otp) => {
  return sendEmailWithRetry({
    to: email,
    subject: "Your Verdora OTP - Valid for 10 minutes",
    html: `
      <h2>Verdora - Verification Code</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="color: #22c55e; font-size: 32px; font-weight: bold; letter-spacing: 2px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p style="color: #666;">If you didn't request this OTP, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0;">
      <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
    `,
  });
};


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
};
