import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "verdora.info@gmail.com",
    pass: "zilnarnrtqqmzeaq", // App Password for Gmail
  },
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  requireTLS: true,
  connectionTimeout: 30000, // 30 seconds
  socketTimeout: 30000, // 30 seconds
  pool: {
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  },
});

// Helper function for retrying email sends with exponential backoff
const sendEmailWithRetry = async (mailOptions, retries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      lastError = error;
      console.error(`Email send attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError;
};

// Helper function to escape HTML characters to prevent injection
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

// Helper function to format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

// Helper function to format items list
const formatItems = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return "<p><strong>Items:</strong> No items</p>";
  }
  
  const itemsList = items
    .map((item) => {
      const name = escapeHtml(item.name || item.productName || "Item");
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      return `<li>${name} (Qty: ${quantity}) - ${formatCurrency(price * quantity)}</li>`;
    })
    .join("");
  
  return `<p><strong>Items:</strong></p><ul>${itemsList}</ul>`;
};

// Helper function to create email template layout
const layout = (title, content) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #fff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          border-bottom: 3px solid #22c55e;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #22c55e;
          margin: 0;
          font-size: 28px;
        }
        .content {
          margin-bottom: 20px;
        }
        .footer {
          border-top: 1px solid #eee;
          padding-top: 15px;
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #888;
        }
        a {
          color: #22c55e;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin: 10px 0;
          background-color: #22c55e;
          color: white;
          border-radius: 4px;
          text-decoration: none;
        }
        .button:hover {
          background-color: #16a34a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${escapeHtml(title)}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>© 2026 Verdora. All rights reserved.</p>
          <p>If you have questions, please contact us at <a href="mailto:support@verdora.in">support@verdora.in</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ✅ Send OTP for verification
export const sendOtpEmail = async (email, otp) => {
  return sendEmailWithRetry({
    from: "verdora.info@gmail.com",
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
