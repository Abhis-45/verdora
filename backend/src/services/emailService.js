import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password for Gmail
  },
});

// ✅ Send OTP for verification
export const sendOtpEmail = async (email, otp) => {
  return transporter.sendMail({
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

// ✅ Send subscription confirmation email
export const sendSubscriptionEmail = async (email) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to Verdora Newsletter!",
    html: `
      <h2>Welcome to Verdora! 🌿</h2>
      <p>Thank you for subscribing to our newsletter.</p>
      <p>You will now receive:</p>
      <ul>
        <li>Exclusive gardening tips & tricks</li>
        <li>New plant arrivals & product launches</li>
        <li>Special discounts & offers</li>
        <li>Care guides for your plants</li>
      </ul>
      <p>Happy gardening!</p>
      <hr>
      <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
    `,
  });
};

// ✅ Send profile update notification
export const sendProfileUpdateEmail = async (email, field) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verdora - Profile Update Confirmation",
    html: `
      <h2>Profile Updated</h2>
      <p>Your ${field} has been successfully updated.</p>
      <p>If this wasn't you, please contact support immediately.</p>
      <hr>
      <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
    `,
  });
};

// ✅ Send account deletion notification
export const sendAccountDeletedEmail = async (email) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verdora - Account Deleted",
    html: `
      <h2>Account Deleted</h2>
      <p>Your Verdora account has been permanently deleted.</p>
      <p>All your data has been removed from our servers.</p>
      <p>We'd love to have you back anytime!</p>
      <hr>
      <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
    `,
  });
};

// ✅ Send vendor order notification email
export const sendVendorOrderNotificationEmail = async (
  email,
  vendorName,
  orderId,
  customer,
  contact,
  deliveryAddress,
  items,
  total,
) => {
  const itemRows = items
    .map(
      (item) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;text-align:left;">${item.title}</td>
          <td style="padding:10px;text-align:center;">${item.quantity}</td>
          <td style="padding:10px;text-align:center;">${item.selectedSize?.label || "-"}</td>
          <td style="padding:10px;text-align:right;">₹${item.price.toFixed(2)}</td>
          <td style="padding:10px;text-align:right;">₹${(
            item.price * item.quantity
          ).toFixed(2)}</td>
        </tr>
      `,
    )
    .join("");

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `New Verdora Order #${orderId.slice(-6)} Received`,
    html: `
      <h2>Hello ${vendorName},</h2>
      <p>You have received a new order from Verdora.</p>
      <p><strong>Order #:</strong> ${orderId}</p>
      <p><strong>Customer:</strong> ${customer}</p>
      <p><strong>Contact:</strong> ${contact.email || "N/A"} / ${contact.mobile || "N/A"}</p>
      <p><strong>Delivery address:</strong> ${deliveryAddress.address}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}</p>
      <p><strong>Total:</strong> ₹${total.toFixed(2)}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:10px;text-align:left;">Product</th>
            <th style="padding:10px;text-align:center;">Qty</th>
            <th style="padding:10px;text-align:center;">Size</th>
            <th style="padding:10px;text-align:right;">Unit</th>
            <th style="padding:10px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <p style="margin-top:16px;">Please process this order promptly and update its status in your Verdora vendor dashboard.</p>
      <hr>
      <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
    `,
  });
};

