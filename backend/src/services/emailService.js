import nodemailer from "nodemailer";
import dns from "dns";
import dotenv from "dotenv";

const dnsPromises = dns.promises;

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_SECURE = process.env.EMAIL_SECURE === "true" || EMAIL_PORT === 465;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || undefined;

// Force IPv4 first, but use resolved IPv4 address directly when possible.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const buildTransporterConfig = async () => {
  const config = {
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    authMethod: "LOGIN",
    requireTLS: !EMAIL_SECURE,
    tls: {
      servername: EMAIL_HOST,
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
    logger: true,
    debug: true,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 40000,
    family: 4,
  };

  if (!EMAIL_SERVICE) {
    try {
      const addresses = await dnsPromises.resolve4(EMAIL_HOST);
      if (addresses && addresses.length > 0) {
        config.host = addresses[0];
        console.log(`✅ Resolved ${EMAIL_HOST} to IPv4 ${config.host}`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not resolve ${EMAIL_HOST} to IPv4: ${err.message}`);
      console.warn(`   Using hostname ${EMAIL_HOST} and letting Node resolve it.`);
    }
  }

  return config;
};

const createTransporter = async () => {
  const transporterConfig = await buildTransporterConfig();
  return nodemailer.createTransport(transporterConfig);
};

export const verifyEmailTransporter = async () => {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    console.log("✅ Email transporter verified successfully");
    return true;
  } catch (err) {
    console.error("❌ Email transporter verification failed:", err.message);
    console.error("⚠️  Solutions:");
    console.error("   1. Check EMAIL_USER and EMAIL_PASS in .env");
    console.error("   2. If using Gmail, enable App Passwords or use an SMTP relay");
    console.error("   3. If Gmail is blocked, set EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE and EMAIL_SERVICE to an alternate SMTP provider");
    return false;
  }
};

const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Email attempt ${attempt}/${maxRetries} to ${mailOptions.to}`);
      const transporter = await createTransporter();
      const result = await transporter.sendMail({
        ...mailOptions,
        timeout: 30000,
      });
      console.log(`✅ Email sent successfully to ${mailOptions.to} (Attempt ${attempt})`);
      return result;
    } catch (err) {
      lastError = err;
      console.error(`❌ Email attempt ${attempt}/${maxRetries} failed for ${mailOptions.to}:`, err.message);
      if (err.code) {
        console.error(`   Error code: ${err.code}`);
      }
      if (err.response) {
        console.error(`   SMTP response: ${err.response}`);
      }

      if (attempt < maxRetries) {
        const delay = 2000 * attempt;
        console.log(`⏳ Retrying email in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError?.message}`);
};

export const sendOtpEmail = async (email, otp) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
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

export const sendWelcomeEmail = async (email, name) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: "Welcome to Verdora!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Welcome to Verdora, ${name}!</h2>
        <p>Thanks for joining Verdora. Your account is now active and ready to use.</p>
        <p>We are excited to help you grow a greener home.</p>
      </div>
    `,
  });
};

export const sendAccountDeletedEmail = async (email, name) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: "Account Deleted - Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Account Deleted</h2>
        <p>Dear ${name},</p>
        <p>Your Verdora account has been successfully deleted as requested.</p>
        <p>If you change your mind, you can always create a new account.</p>
        <p>Thank you for being part of Verdora.</p>
      </div>
    `,
  });
};

export const sendVendorOrderNotificationEmail = async (email, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `New Order #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">New Order Received!</h2>
        <p>You have received a new order.</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
        <p><strong>Total:</strong> ₹${orderDetails.total}</p>
        <p>Please process this order promptly.</p>
      </div>
    `,
  });
};

export const sendUserOrderConfirmationEmail = async (email, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Order Confirmed #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Order Confirmed!</h2>
        <p>Thank you for your order.</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Total:</strong> ₹${orderDetails.total}</p>
        <p>You will receive updates on your order status.</p>
      </div>
    `,
  });
};

export const sendOrderStatusUpdateEmail = async (email, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Order Status Update #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Order Status Update</h2>
        <p>Your order status has been updated.</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>New Status:</strong> ${orderDetails.status}</p>
        <p>Thank you for shopping with Verdora.</p>
      </div>
    `,
  });
};

export const sendUserReturnRequestEmail = async (email, returnDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Return Request #${returnDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Return Request Received</h2>
        <p>Your return request has been received.</p>
        <p><strong>Order ID:</strong> ${returnDetails.orderId}</p>
        <p><strong>Reason:</strong> ${returnDetails.reason}</p>
        <p>We will process your return request within 3-5 business days.</p>
      </div>
    `,
  });
};

export const sendUserOrderCancelledEmail = async (email, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Order Cancelled #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Order Cancelled</h2>
        <p>Your order has been cancelled.</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Reason:</strong> ${orderDetails.reason || 'Customer request'}</p>
        <p>Refund will be processed within 5-7 business days.</p>
      </div>
    `,
  });
};

export const sendServiceBookingConfirmationEmail = async (email, serviceDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Service Booking Confirmed - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Service Booking Confirmed!</h2>
        <p>Your service booking has been confirmed.</p>
        <p><strong>Service:</strong> ${serviceDetails.serviceName}</p>
        <p><strong>Date:</strong> ${serviceDetails.date}</p>
        <p><strong>Time:</strong> ${serviceDetails.time}</p>
        <p>Our team will contact you shortly.</p>
      </div>
    `,
  });
};

export const sendAdminContactNotificationEmail = async (adminEmail, contactData) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: adminEmail,
    subject: "New Contact Form Submission - Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
        <p><strong>Subject:</strong> ${contactData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.message}</p>
      </div>
    `,
  });
};

export const sendContactFormEmail = async (userEmail, contactData) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: userEmail,
    subject: "Thank you for contacting Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Thank you for contacting us!</h2>
        <p>Dear ${contactData.name},</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <p>${contactData.message}</p>
        <p>Best regards,<br>Verdora Team</p>
      </div>
    `,
  });
};

export const sendNewsletterSubscriptionEmail = async (email, name) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: "Welcome to Verdora Newsletter!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Welcome to our Newsletter!</h2>
        <p>Dear ${name || 'Subscriber'},</p>
        <p>Thank you for subscribing to Verdora's newsletter.</p>
        <p>You will receive updates on new products, gardening tips, and special offers.</p>
      </div>
    `,
  });
};

export const sendVendorApplicationEmail = async (vendorEmail, applicationData) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: vendorEmail,
    subject: "Vendor Application Received - Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Application Received!</h2>
        <p>Dear ${applicationData.name},</p>
        <p>Your vendor application has been received.</p>
        <p>We will review your application and get back to you within 3-5 business days.</p>
        <p>Application ID: ${applicationData.applicationId}</p>
      </div>
    `,
  });
};

export const sendVendorApprovalEmail = async (vendorEmail, vendorData) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: vendorEmail,
    subject: "Vendor Application Approved - Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Congratulations! Your Application is Approved</h2>
        <p>Dear ${vendorData.name},</p>
        <p>Your vendor application has been approved!</p>
        <p>You can now start selling your products on Verdora.</p>
        <p>Please log in to your vendor dashboard to add your products.</p>
      </div>
    `,
  });
};

export const sendVendorRejectionEmail = async (vendorEmail, vendorData) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: vendorEmail,
    subject: "Vendor Application Status - Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Application Status Update</h2>
        <p>Dear ${vendorData.name},</p>
        <p>After careful review, we regret to inform you that your vendor application could not be approved at this time.</p>
        <p>You can reapply after 3 months or contact support for more information.</p>
      </div>
    `,
  });
};

export const sendContactEmail = async (email, contactData) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: "Thank you for contacting Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Thank you for contacting us!</h2>
        <p>Dear ${contactData.name},</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <p>${contactData.message}</p>
        <p>Best regards,<br>Verdora Team</p>
      </div>
    `,
  });
};

export const sendSubscriptionEmail = async (email, name) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: "Welcome to Verdora Newsletter!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Welcome to our Newsletter!</h2>
        <p>Dear ${name || 'Subscriber'},</p>
        <p>Thank you for subscribing to Verdora's newsletter.</p>
        <p>You will receive updates on new products, gardening tips, and special offers.</p>
      </div>
    `,
  });
};

export const sendVendorRegistrationSubmittedEmail = async (vendorEmail, applicationData) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: vendorEmail,
    subject: "Vendor Application Received - Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Application Received!</h2>
        <p>Dear ${applicationData.name},</p>
        <p>Your vendor application has been received.</p>
        <p>We will review your application and get back to you within 3-5 business days.</p>
        <p>Application ID: ${applicationData.applicationId}</p>
      </div>
    `,
  });
};

export const sendUserOrderShippedEmail = async (email, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Order Shipped #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Your Order Has Shipped!</h2>
        <p>Great news! Your order has been shipped.</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Tracking Number:</strong> ${orderDetails.trackingNumber || 'Will be provided soon'}</p>
        <p><strong>Estimated Delivery:</strong> ${orderDetails.estimatedDelivery || '2-5 business days'}</p>
        <p>You can track your order at https://verdora.com/orders</p>
      </div>
    `,
  });
};

export const sendUserOrderDeliveredEmail = async (email, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Order Delivered #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Your Order Has Been Delivered!</h2>
        <p>Your order has been successfully delivered.</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Delivered Date:</strong> ${orderDetails.deliveredDate || new Date().toLocaleDateString()}</p>
        <p>Please review your order and let us know if you have any questions.</p>
        <p>Thank you for shopping with Verdora!</p>
      </div>
    `,
  });
};

export const sendUserOrderOutForDeliveryEmail = async (email, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Order Out for Delivery #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Your Order is Out for Delivery!</h2>
        <p>Your order is now out for delivery.</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Delivery Partner:</strong> ${orderDetails.deliveryPartner || 'Our delivery partner'}</p>
        <p><strong>Expected Today:</strong> ${orderDetails.expectedToday ? 'Yes' : 'No'}</p>
        <p>Please be available at the delivery address.</p>
      </div>
    `,
  });
};

export const sendUserOrderReturnedEmail = async (email, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Return Processed #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Return Processed</h2>
        <p>Your return request has been processed.</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Return Reason:</strong> ${orderDetails.returnReason}</p>
        <p><strong>Refund Amount:</strong> ₹${orderDetails.refundAmount}</p>
        <p>Refund will be processed within 5-7 business days.</p>
      </div>
    `,
  });
};

export const sendUserOrderRefundedEmail = async (email, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: email,
    subject: `Refund Processed #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Refund Processed</h2>
        <p>Your refund has been successfully processed.</p>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Refund Amount:</strong> ₹${orderDetails.refundAmount}</p>
        <p><strong>Refund Method:</strong> ${orderDetails.refundMethod || 'Original payment method'}</p>
        <p>The amount should reflect in your account within 3-5 business days.</p>
      </div>
    `,
  });
};

export const sendUserRefundProcessedEmail = async (email, orderDetails) => {
  return sendUserOrderRefundedEmail(email, orderDetails);
};

export const sendVendorApprovedEmail = async (vendorEmail, vendorData) => {
  return sendVendorApprovalEmail(vendorEmail, vendorData);
};

export const sendVendorRejectedEmail = async (vendorEmail, vendorData) => {
  return sendVendorRejectionEmail(vendorEmail, vendorData);
};

export const sendVendorReadyToShipEmail = async (vendorEmail, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: vendorEmail,
    subject: `Order Ready to Ship #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Order Ready to Ship</h2>
        <p>Dear Vendor,</p>
        <p>Order #${orderDetails.orderId} is ready to be shipped.</p>
        <p><strong>Customer:</strong> ${orderDetails.customerName}</p>
        <p><strong>Items:</strong> ${orderDetails.items}</p>
        <p>Please ship the order and update the tracking information.</p>
      </div>
    `,
  });
};

export const sendVendorOrderShippedEmail = async (vendorEmail, orderDetails) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email credentials are not configured");
  }

  return sendEmailWithRetry({
    from: EMAIL_USER,
    to: vendorEmail,
    subject: `Order Shipped Confirmation #${orderDetails.orderId} - Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Order Shipped</h2>
        <p>Dear Vendor,</p>
        <p>Order #${orderDetails.orderId} has been shipped successfully.</p>
        <p><strong>Tracking Number:</strong> ${orderDetails.trackingNumber}</p>
        <p><strong>Carrier:</strong> ${orderDetails.carrier}</p>
        <p>Thank you for your prompt service.</p>
      </div>
    `,
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
  sendSubscriptionEmail,
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