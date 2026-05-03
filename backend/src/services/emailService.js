import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Primary: Gmail with port 587 and STARTTLS (works better on hosting)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS instead of SSL
  auth: {
    user: "verdora.info@gmail.com",
    pass: "zilnarnrtqqmzeaq",
  },
  tls: {
    rejectUnauthorized: false // For hosting compatibility
  },
  // ✅ Force IPv4 connections (fixes Render IPv6 issues)
  family: 4,
  // ✅ Connection settings for containerized environments
  connectionTimeout: 30000, // 30 seconds
  socketTimeout: 30000, // 30 seconds
  // ✅ Debug logging for troubleshooting
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// ✅ Fallback: Gmail with port 465 and SSL (alternative for hosting)
const fallbackTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: "verdora.info@gmail.com",
    pass: "zilnarnrtqqmzeaq",
  },
  tls: {
    rejectUnauthorized: false
  },
  // ✅ Force IPv4 connections
  family: 4,
  connectionTimeout: 30000,
  socketTimeout: 30000,
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

// ✅ Verify transporter on startup
export const verifyEmailTransporter = async () => {
  console.log("🔍 Verifying email transporters...");

  // Test primary transporter (port 587)
  try {
    await transporter.verify();
    console.log("✅ Primary email transporter verified successfully (Port 587 STARTTLS)");
  } catch (err) {
    console.error("❌ Primary email transporter verification failed:", err.message);
  }

  // Test fallback transporter (port 465)
  try {
    await fallbackTransporter.verify();
    console.log("✅ Fallback email transporter verified successfully (Port 465 SSL)");
  } catch (err) {
    console.error("❌ Fallback email transporter verification failed:", err.message);
  }

  console.log("⚠️  Solutions if both fail:");
  console.log("   1. Check EMAIL_USER and EMAIL_PASS in .env");
  console.log("   2. Enable 'Less Secure App Access' for Gmail: https://myaccount.google.com/lesssecureapps");
  console.log("   3. Or use an App Password: https://support.google.com/accounts/answer/185833");
  console.log("   4. Alternative: Use SendGrid (recommended for production)");
  console.log("   5. For Render: Check if SMTP ports are blocked in your plan");

  return true; // Always return true to not break startup
};
// ✅ Generic email send helper with retry logic and fallback transporter
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // On the last attempt, try the fallback transporter (port 465 SSL)
      const currentTransporter = attempt === maxRetries ? fallbackTransporter : transporter;
      const portInfo = attempt === maxRetries ? '465 (SSL)' : '587 (STARTTLS)';

      const result = await currentTransporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to} using port ${portInfo} (Attempt ${attempt})`);
      return result;
    } catch (err) {
      lastError = err;
      const portInfo = attempt === maxRetries ? '465 (SSL)' : '587 (STARTTLS)';
      console.error(`❌ Attempt ${attempt} failed for ${mailOptions.to} using port ${portInfo}:`, err.message);

      // Check for specific network errors that indicate IPv6/IPv4 issues
      if (err.code === 'ENETUNREACH' || err.code === 'EHOSTUNREACH') {
        console.error(`⚠️  Network connectivity issue detected. This may be due to IPv6 blocking in containerized environments.`);
        console.error(`💡 Consider using SendGrid or another SMTP provider for better reliability.`);
      }

      if (attempt < maxRetries) {
        const delay = 1000 * attempt; // Exponential backoff: 1s, 2s, 3s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
};

// ✅ Send OTP for verification with retry logic
export const sendOtpEmail = async (email, otp) => {
  return sendEmailWithRetry({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Verdora OTP",
    html: `
      <h2>Verdora - Verification Code</h2>
      <p>Your One-Time Password (OTP) is:</p>
      <h1 style="color: #22c55e; font-size: 32px; font-weight: bold;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr>
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
