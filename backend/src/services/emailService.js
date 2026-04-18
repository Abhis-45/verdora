import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ Primary: Gmail with port 587 and STARTTLS (works better on hosting)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS instead of SSL
  family: 4, // Force IPv4 (fixes ENETUNREACH IPv6 errors)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false // For hosting compatibility
  }
});

// ✅ Verify transporter on startup
export const verifyEmailTransporter = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email transporter verified successfully (Port 587 STARTTLS)");
    return true;
  } catch (err) {
    console.error("❌ Email transporter verification failed:", err.message);
    console.error("⚠️  Solutions:");
    console.error("   1. Check EMAIL_USER and EMAIL_PASS in .env");
    console.error("   2. Enable 'Less Secure App Access' for Gmail: https://myaccount.google.com/lesssecureapps");
    console.error("   3. Or use an App Password: https://support.google.com/accounts/answer/185833");
    console.error("   4. Alternative: Use SendGrid (recommended for production)");
    return false;
  }
};

// ✅ Generic email send helper with retry logic
const sendEmailWithRetry = async (mailOptions, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to} (Attempt ${attempt})`);
      return result;
    } catch (err) {
      lastError = err;
      console.error(`❌ Attempt ${attempt} failed for ${mailOptions.to}:`, err.message);
      
      if (attempt < maxRetries) {
        const delay = 1000 * attempt;
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

// ✅ Send subscription confirmation email with better formatting
export const sendSubscriptionEmail = async (email) => {
  return sendEmailWithRetry({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "🌿 Welcome to Verdora Newsletter - Exclusive Garden Tips Await!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e; text-align: center;">Welcome to Verdora! 🌿</h2>
        <p style="color: #475569; font-size: 16px;">Hi there,</p>
        <p style="color: #475569;">Thank you for subscribing to the Verdora Newsletter! You're now part of our gardening community.</p>
        
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 6px;">
          <h3 style="color: #166534; margin-top: 0; font-size: 18px;">📬 What You'll Receive:</h3>
          <ul style="color: #334155; line-height: 2; list-style: none; padding-left: 0; margin: 0;">
            <li style="padding: 8px 0;">✨ <strong>Exclusive Gardening Tips & Tricks</strong> from expert gardeners</li>
            <li style="padding: 8px 0;">🌱 <strong>New Plant Arrivals</strong> and product launches</li>
            <li style="padding: 8px 0;">💚 <strong>Special Discounts & Offers</strong> for subscribers only</li>
            <li style="padding: 8px 0;">📖 <strong>Care Guides & Seasonal Advice</strong> for your plants</li>
            <li style="padding: 8px 0;">🎁 <strong>Exclusive Contests</strong> and rewards program</li>
          </ul>
        </div>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 0; color: #92400e;">
            <strong>💡 Tip:</strong> Add support@verdora.com to your contacts to ensure our emails reach your inbox!
          </p>
        </div>

        <p style="color: #475569; text-align: center; margin-top: 30px;">
          Discover amazing plants, get expert advice, and grow your green space with Verdora.
        </p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="https://verdora.com" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
            🌿 Explore Verdora
          </a>
        </div>

        <p style="color: #64748b; margin-top: 20px; font-size: 14px;">
          <strong>Questions?</strong> Reach out to us at <strong>support@verdora.com</strong> – we're here to help!
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #888; font-size: 11px; text-align: center;">
          © 2026 Verdora. All rights reserved. | Growing Green, Growing Together 🌱
        </p>
      </div>
    `,
  });
};

// ✅ Send admin notification for new contact form submission
export const sendAdminContactNotificationEmail = async (
  adminEmail,
  contactDetails
) => {
  const { name, email, phone, message, service, servicePackage } = contactDetails;
  
  return sendEmailWithRetry({
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `📧 New Contact Form Submission${service ? ` - ${service}` : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">📬 New Contact Form Submission</h2>
        <p style="color: #475569;">You have received a new message through the Verdora contact form.</p>
        
        <div style="background: #f8fafc; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <h3 style="color: #166534; margin-top: 0;">Contact Details:</h3>
          <table style="width: 100%; color: #475569; line-height: 1.8;">
            <tr>
              <td style="font-weight: bold; width: 30%; padding: 5px 0;">Name:</td>
              <td style="padding: 5px 0;">${name}</td>
            </tr>
            <tr style="background: #f0fdf4;">
              <td style="font-weight: bold; padding: 5px 0;">Email:</td>
              <td style="padding: 5px 0;"><a href="mailto:${email}" style="color: #22c55e; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 5px 0;">Phone:</td>
              <td style="padding: 5px 0;"><a href="tel:${phone}" style="color: #22c55e; text-decoration: none;">${phone}</a></td>
            </tr>
            ${service ? `
            <tr style="background: #f0fdf4;">
              <td style="font-weight: bold; padding: 5px 0;">Service:</td>
              <td style="padding: 5px 0;">${service}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 5px 0;">Package:</td>
              <td style="padding: 5px 0;">${servicePackage || 'N/A'}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <h3 style="color: #1e40af; margin-top: 0;">Message:</h3>
          <p style="color: #1e40af; white-space: pre-wrap; font-family: monospace; background: white; padding: 10px; border-radius: 4px; margin: 0;">${message}</p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px;">
          <p style="margin: 5px 0;"><strong>⏰ Received:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          <p style="margin: 5px 0;"><strong>📧 Reply To:</strong> <a href="mailto:${email}" style="color: #92400e; text-decoration: none;">${email}</a></p>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.ADMIN_DASHBOARD_URL || 'https://verdora.com/admin'}" style="display: inline-block; background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            📊 View in Admin Dashboard
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #888; font-size: 11px; text-align: center;">
          © 2026 Verdora Admin System
        </p>
      </div>
    `,
  });
};

// ✅ Send contact form confirmation email
export const sendContactEmail = async (email, name) => {
  return sendEmailWithRetry({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "We received your message - Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Message Received! ✓</h2>
        <p>Hi ${name || "there"},</p>
        <p>Thank you for reaching out to Verdora. We have received your message and our team will get back to you shortly.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #166534;"><strong>Response Timeline:</strong> We typically respond within 24-48 hours during business days.</p>
        </div>

        <p style="color: #475569;">In the meantime, if you have any urgent questions, feel free to:</p>
        <ul style="color: #475569; line-height: 1.8;">
          <li>📧 Email us directly at <strong>support@verdora.com</strong></li>
          <li>📞 Call our support team</li>
          <li>💬 Check out our FAQ section on the website</li>
        </ul>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1e40af;">We appreciate your interest in Verdora!</p>
        </div>

        <p style="color: #64748b; margin-top: 20px;">
          Best regards,<br/>
          <strong>The Verdora Team 🌱</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ Send profile update notification
export const sendProfileUpdateEmail = async (email, field) => {
  return sendEmailWithRetry({
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
  return sendEmailWithRetry({
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

  return sendEmailWithRetry({
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

// ✅ USER WELCOME EMAIL ON SIGNUP
// ✅ USER WELCOME EMAIL ON SIGNUP
export const sendWelcomeEmail = async (email, userName) => {
  return sendEmailWithRetry({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to Verdora! 🌿 Your Gardening Journey Starts Here",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Welcome to Verdora, ${userName}! 🌿</h2>
        <p>Thank you for joining Verdora - your trusted plant and gardening hub!</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #166534; margin-top: 0;">What You Can Do Now:</h3>
          <ul style="color: #334155; line-height: 1.8;">
            <li>🛒 Browse and purchase from our collection of plants & gardening products</li>
            <li>💚 Add items to your wishlist for later</li>
            <li>🚚 Track your orders in real-time</li>
            <li>📝 Write reviews and help other gardeners</li>
            <li>📬 Subscribe to our newsletter for exclusive tips & offers</li>
          </ul>
        </div>

        <p style="color: #475569;">We're committed to providing you with:</p>
        <ul style="color: #475569; line-height: 1.8;">
          <li>✓ Quality plants and products</li>
          <li>✓ Fast and reliable delivery</li>
          <li>✓ Expert gardening advice</li>
          <li>✓ Excellent customer support</li>
        </ul>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1e40af;">Need help? Contact us at <strong>support@verdora.com</strong></p>
        </div>

        <p style="margin-top: 30px; color: #64748b;">
          Happy gardening!<br/>
          <strong>The Verdora Team 🌱</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ USER ORDER CONFIRMATION EMAIL
export const sendUserOrderConfirmationEmail = async (
  email,
  userName,
  orderId,
  items,
  address,
  total,
  deliveryEstimate
) => {
  const itemRows = items
    .map(
      (item) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px;text-align:left;"><strong>${item.title}</strong></td>
          <td style="padding:10px;text-align:center;">${item.quantity}</td>
          <td style="padding:10px;text-align:right;">₹${item.price.toFixed(2)}</td>
          <td style="padding:10px;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
    )
    .join("");

  return sendEmailWithRetry({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order Confirmed! Order #${orderId.slice(-6)} | Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Order Confirmed! ✓</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for your order! We've received it and are getting it ready for shipment.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${deliveryEstimate || "2-5 business days"}</p>
        </div>

        <h3 style="color: #334155;">Order Items:</h3>
        <table style="width:100%;border-collapse:collapse;margin-top:10px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px;text-align:left;">Product</th>
              <th style="padding:10px;text-align:center;">Qty</th>
              <th style="padding:10px;text-align:right;">Price</th>
              <th style="padding:10px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="text-align:right;margin-top:15px;padding-top:15px;border-top:1px solid #e2e8f0;">
          <h3 style="color: #22c55e; margin: 5px 0;">₹${total.toFixed(2)}</h3>
        </div>

        <h3 style="color: #334155; margin-top: 20px;">Delivery Address:</h3>
        <p style="background: #f8fafc; padding: 10px; border-radius: 4px; color: #475569;">
          ${address?.address || "N/A"}<br/>
          ${address?.city || ""}, ${address?.state || ""} - ${address?.pincode || ""}
        </p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e;"><strong>📦 What's Next?</strong></p>
          <p style="margin-top: 10px; color: #92400e; font-size: 14px;">
            We'll send you a shipping confirmation with a tracking link as soon as your order ships. You can also track your order in the "My Orders" section of your account.
          </p>
        </div>

        <p style="color: #64748b; margin-top: 20px;">
          If you have any questions, please don't hesitate to contact us at <strong>support@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ USER ORDER SHIPPED NOTIFICATION
export const sendUserOrderShippedEmail = async (
  email,
  userName,
  orderId,
  trackingLink,
  estimatedDelivery
) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🚚 Your Order #${orderId.slice(-6)} Has Shipped! | Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Your Order is On the Way! 🚚</h2>
        <p>Hi ${userName},</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> 📦 Shipped</p>
          <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery || "2-5 business days"}</p>
        </div>

        ${trackingLink ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${trackingLink}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              🔗 Track Your Shipment
            </a>
          </div>
        ` : ""}

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0; color: #1e40af;">💡 Tips:</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
            <li>Check for delivery updates regularly</li>
            <li>Keep someone available to receive the package</li>
            <li>Inspect the package upon receipt</li>
          </ul>
        </div>

        <p style="color: #64748b;">
          Have questions? Contact us at <strong>support@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ USER ORDER DELIVERED NOTIFICATION
export const sendUserOrderDeliveredEmail = async (
  email,
  userName,
  orderId
) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `✓ Order #${orderId.slice(-6)} Delivered! | Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Your Order Has Been Delivered! ✓</h2>
        <p>Hi ${userName},</p>
        <p>Your order has been successfully delivered. We hope you enjoy your plants and products!</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ✓ Delivered</p>
          <p style="margin: 5px 0;"><strong>Delivered on:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0; color: #92400e;">📝 Share Your Feedback</h4>
          <p style="margin-top: 10px; color: #92400e; font-size: 14px;">
            We'd love to hear what you think! Please write a review and ratings for the products you received. Your feedback helps us improve and helps other gardeners make better choices.
          </p>
        </div>

        <p style="margin-top: 10px; color: #64748b;">
          <strong>Have any issues?</strong> You can request a return or replacement within 3 days of delivery from your "My Orders" section.
        </p>

        <p style="color: #64748b; margin-top: 20px;">
          Thank you for shopping with Verdora! <br/>
          Questions? Contact us at <strong>support@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ USER ORDER CANCELLED NOTIFICATION
export const sendUserOrderCancelledEmail = async (
  email,
  userName,
  orderId,
  reason
) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order #${orderId.slice(-6)} Cancelled | Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Order Cancelled</h2>
        <p>Hi ${userName},</p>
        <p>Your order has been cancelled as requested.</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Cancelled</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || "Cancelled by user"}</p>
        </div>

        <p style="color: #475569;">
          Your refund will be processed within 5-7 business days. Please check your bank account for the refund.
        </p>

        <p style="color: #64748b; margin-top: 20px;">
          If you have any questions, please contact us at <strong>support@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ USER RETURN REQUEST ACKNOWLEDGEMENT
export const sendUserReturnRequestEmail = async (
  email,
  userName,
  orderId,
  itemTitle,
  returnType
) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${returnType === 'returned' ? '↩️ Return' : '🔄 Replacement'} Request Received | Order #${orderId.slice(-6)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">${returnType === 'returned' ? '↩️ Return' : '🔄 Replacement'} Request Received</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for submitting your ${returnType === 'returned' ? 'return' : 'replacement'} request. We're processing it now.</p>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Product:</strong> ${itemTitle}</p>
          <p style="margin: 5px 0;"><strong>Request Type:</strong> ${returnType === 'returned' ? '↩️ Return' : '🔄 Replacement'}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Under Review</p>
        </div>

        <div style="background: #f0f9ff; border: 1px solid #bfdbfe; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0; color: #1e40af;">📋 What Happens Next:</h4>
          <ol style="margin: 10px 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
            <li>Our team will review your request</li>
            <li>You'll receive ${returnType === 'returned' ? 'a return shipping label' : 'instructions'}</li>
            <li>The vendor will inspect the item upon receipt</li>
            <li>You'll be notified of the decision</li>
          </ol>
        </div>

        <p style="color: #64748b;">
          Questions? <strong>support@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ USER REFUND PROCESSED
export const sendUserRefundProcessedEmail = async (
  email,
  userName,
  orderId,
  refundAmount
) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `💰 Refund Processed | Order #${orderId.slice(-6)} | Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Refund Processed ✓</h2>
        <p>Hi ${userName},</p>
        <p>Great news! Your refund has been processed and will appear in your account within 5-7 business days.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Refund Amount:</strong> <span style="font-size: 18px; font-weight: bold;">₹${refundAmount.toFixed(2)}</span></p>
          <p style="margin: 5px 0;"><strong>Processing Time:</strong> 5-7 business days</p>
        </div>

        <p style="color: #475569;">
          The refund will be credited to your original payment method. Please allow some time for your bank to reflect the credit.
        </p>

        <p style="color: #64748b; margin-top: 20px;">
          Thank you for shopping with Verdora! We hope to see you again.<br/>
          Contact: <strong>support@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ VENDOR REGISTRATION REQUEST RECEIVED (to vendor applicant)
export const sendVendorRegistrationSubmittedEmail = async (
  email,
  vendorName,
  businessName
) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Vendor Registration Application Received | Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Application Received! 🎉</h2>
        <p>Hi ${vendorName},</p>
        <p>Thank you for your interest in becoming a Verdora vendor! We've received your application and our team is reviewing it.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Business Name:</strong> ${businessName}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> 📋 Under Review</p>
          <p style="margin: 5px 0;"><strong>Application Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0; color: #1e40af;">⏱️ What Happens Next:</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
            <li>Our team will verify your business details</li>
            <li>You'll receive an email approval (typically within 3-5 business days)</li>
            <li>Once approved, you can log in to your vendor dashboard</li>
            <li>Start uploading your products and processing orders!</li>
          </ul>
        </div>

        <p style="color: #64748b;">
          In the meantime, if you have any questions, feel free to contact us at <strong>support@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ VENDOR REGISTRATION APPROVED (admin accepts vendor request)
export const sendVendorApprovedEmail = async (
  email,
  vendorName,
  businessName,
  loginUrl
) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "✓ Your Vendor Application Approved! | Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Congratulations! Your Application is Approved! ✓</h2>
        <p>Hi ${vendorName},</p>
        <p>Great news! Your vendor application has been approved by our admin team. Welcome to Verdora!</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Business Name:</strong> ${businessName}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> ✓ Active</p>
          <p style="margin: 5px 0;"><strong>Approved Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="text-align: center; margin: 20px 0;">
          <a href="${loginUrl || 'https://verdora.com/vendor/login'}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            🔑 Login to Your Vendor Dashboard
          </a>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0; color: #1e40af;">🚀 Next Steps:</h4>
          <ol style="margin: 10px 0; padding-left: 20px; color: #1e40af; font-size: 14px;">
            <li>Log in to your vendor dashboard</li>
            <li>Complete your business profile</li>
            <li>Upload your products</li>
            <li>Start receiving orders!</li>
          </ol>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0; color: #92400e;">💡 Resources:</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #92400e; font-size: 14px;">
            <li>Vendor Guidelines & Best Practices</li>
            <li>Product Upload Tutorial</li>
            <li>Order Management Guide</li>
          </ul>
        </div>

        <p style="color: #64748b;">
          Have questions? Our vendor support team is here to help: <strong>vendors@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ VENDOR REGISTRATION REJECTED
export const sendVendorRejectedEmail = async (
  email,
  vendorName,
  businessName,
  rejectionReason
) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Vendor Application - More Information Needed | Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Application Status Update</h2>
        <p>Hi ${vendorName},</p>
        <p>Thank you for applying to become a Verdora vendor. After careful review, we have decided not to approve your application at this time.</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Business Name:</strong> ${businessName}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> Not Approved</p>
          ${rejectionReason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
        </div>

        <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="margin: 0; color: #92400e;">📝 Next Steps:</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #92400e; font-size: 14px;">
            <li>Review and improve your business details</li>
            <li>Address any concerns mentioned above</li>
            <li>You can reapply after 30 days</li>
          </ul>
        </div>

        <p style="color: #64748b;">
          If you have any questions or would like more feedback, please contact us at <strong>vendors@verdora.com</strong>
        </p>

        <p style="color: #64748b; margin-top: 20px;">
          We appreciate your interest in Verdora and hope to work with you in the future!
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ VENDOR ACCOUNT DEACTIVATED (status changed to inactive)
export const sendVendorDeactivatedEmail = async (
  email,
  vendorName,
  reason
) => {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Vendor Account Deactivated | Verdora",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Account Deactivated</h2>
        <p>Hi ${vendorName},</p>
        <p>Your vendor account on Verdora has been deactivated.</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Account Status:</strong> Deactivated</p>
          ${reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>

        <p style="color: #475569;">
          You will no longer be able to log in to your vendor dashboard or process new orders. Any pending orders will be handled by our support team.
        </p>

        <p style="color: #64748b; margin-top: 20px;">
          If this was a mistake or you would like to discuss this further, please contact us at <strong>vendors@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ ORDER ITEM STATUS UPDATE (general purpose for any status change)
export const sendOrderStatusUpdateEmail = async (
  email,
  userName,
  orderId,
  itemTitle,
  newStatus,
  reason
) => {
  const statusConfig = {
    'shipped': { icon: '🚚', message: 'Your order is on the way!' },
    'delivered': { icon: '✓', message: 'Your order has been delivered!' },
    'returned': { icon: '↩️', message: 'Return request is being processed.' },
    'replaced': { icon: '🔄', message: 'Replacement is being processed.' },
    'refunded': { icon: '💰', message: 'Your refund has been processed.' },
    'cancelled': { icon: '❌', message: 'Your order has been cancelled.' }
  };

  const config = statusConfig[newStatus] || { icon: '📦', message: 'Order status updated.' };

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `${config.icon} Order Update | #${orderId.slice(-6)} | Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">${config.icon} Order Update</h2>
        <p>Hi ${userName},</p>
        <p>${config.message}</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Product:</strong> ${itemTitle}</p>
          <p style="margin: 5px 0;"><strong>New Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
          <p style="margin: 5px 0;"><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          ${reason ? `<p style="margin: 5px 0;"><strong>Details:</strong> ${reason}</p>` : ''}
        </div>

        <p style="color: #64748b;">
          View your complete order history in your Verdora account.
        </p>

        <p style="color: #64748b; margin-top: 20px;">
          Questions? Contact us at <strong>support@verdora.com</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ VENDOR NOTIFICATION - ORDER READY TO SHIP
export const sendVendorReadyToShipEmail = async (
  vendorEmail,
  vendorName,
  orderId,
  customerName,
  vendorItems,
  orderDate
) => {
  const itemsList = vendorItems
    .map((item) => `<li>${item.title || item.name} (Qty: ${item.quantity})</li>`)
    .join("");

  return sendEmailWithRetry({
    from: process.env.EMAIL_USER,
    to: vendorEmail,
    subject: `📦 Prepare for Shipment - Order #${String(orderId).slice(-6)} | Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">📦 Order Ready to Ship</h2>
        <p>Hi ${vendorName},</p>
        <p>A new order has been accepted and is ready for shipment!</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${String(orderId).slice(-6)}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(orderDate).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Items:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${itemsList}
          </ul>
        </div>

        <p style="color: #475569;">Please prepare these items for shipment and update the status once dispatched.</p>
        <p style="color: #64748b;">
          Questions about this order? <a href="https://verdora.com/vendor/orders" style="color: #22c55e; text-decoration: none;">View in dashboard</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ VENDOR NOTIFICATION - ORDER SHIPPED
export const sendVendorOrderShippedEmail = async (
  vendorEmail,
  vendorName,
  orderId,
  customerName,
  vendorItems
) => {
  const itemsList = vendorItems
    .map((item) => `<li>${item.title || item.name} (Qty: ${item.quantity})</li>`)
    .join("");

  return sendEmailWithRetry({
    from: process.env.EMAIL_USER,
    to: vendorEmail,
    subject: `🚚 Order Shipped - Order #${String(orderId).slice(-6)} | Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">🚚 Order Shipped</h2>
        <p>Hi ${vendorName},</p>
        <p>Your items in this order have been shipped!</p>
        
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 5px 0;"><strong>Order #:</strong> ${String(orderId).slice(-6)}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
          <p style="margin: 5px 0;"><strong>Items Shipped:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${itemsList}
          </ul>
        </div>

        <p style="color: #475569;">Thank you for your partnership with Verdora!</p>
        <p style="color: #64748b;">
          <strong>Need help?</strong> Contact support at <strong>support@verdora.com</strong>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #888; font-size: 12px;">© 2026 Verdora. All rights reserved.</p>
      </div>
    `,
  });
};

// ✅ SERVICE BOOKING CONFIRMATION EMAIL
export const sendServiceBookingConfirmationEmail = async (
  email,
  customerName,
  serviceTitle,
  packageName,
  selectedDate,
  selectedTime,
  price,
  message
) => {
  return sendEmailWithRetry({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `✓ Service Booking Confirmed - ${serviceTitle} | Verdora`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Service Booking Confirmed! ✓</h2>
        <p>Hi ${customerName},</p>
        <p>Thank you for booking with Verdora! We're excited to serve you. Here are your booking details:</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #166534; margin-top: 0; margin-bottom: 10px;">📋 Booking Details</h3>
          <table style="width: 100%; color: #475569; line-height: 1.8;">
            <tr>
              <td style="font-weight: bold; width: 40%; padding: 5px 0;">Service:</td>
              <td style="padding: 5px 0;">${serviceTitle}</td>
            </tr>
            <tr style="background: #ecfdf5;">
              <td style="font-weight: bold; padding: 5px 0;">Package:</td>
              <td style="padding: 5px 0;">${packageName}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 5px 0;">Scheduled Date:</td>
              <td style="padding: 5px 0;">${new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr style="background: #ecfdf5;">
              <td style="font-weight: bold; padding: 5px 0;">Scheduled Time:</td>
              <td style="padding: 5px 0;">${selectedTime}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 5px 0;">Price:</td>
              <td style="padding: 5px 0; color: #22c55e; font-size: 16px; font-weight: bold;">₹${price}</td>
            </tr>
          </table>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="color: #1e40af; margin-top: 0;">📞 What Happens Next:</h4>
          <ol style="color: #1e40af; padding-left: 20px; margin: 10px 0; line-height: 1.8;">
            <li>Our team will confirm your booking and contact you within 24 hours</li>
            <li>We'll discuss any specific requirements or preferences</li>
            <li>Our expert will arrive at the scheduled time with all necessary materials</li>
            <li>You'll receive a follow-up message after service completion</li>
          </ol>
        </div>

        ${message ? `
        <div style="background: #f8fafc; border-left: 4px solid #64748b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="color: #1e3a8a; margin-top: 0;">📝 Your Special Requests:</h4>
          <p style="color: #475569; margin: 10px 0; white-space: pre-wrap;">${message}</p>
        </div>
        ` : ''}

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h4 style="color: #92400e; margin-top: 0;">💡 Important Information:</h4>
          <ul style="color: #92400e; padding-left: 20px; margin: 10px 0; line-height: 1.8;">
            <li>Please ensure someone is available at the scheduled time</li>
            <li>Our team will call you 30 minutes before arrival</li>
            <li>Payment can be made at the time of service</li>
            <li>We offer a satisfaction guarantee on all services</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 25px 0;">
          <p style="color: #475569; font-size: 14px; margin-bottom: 10px;">Need to reschedule or cancel?</p>
          <a href="https://verdora.com/orders" style="display: inline-block; background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 25px; font-weight: bold;">
            ✏️ Manage Booking
          </a>
        </div>

        <p style="color: #64748b; margin-top: 20px;">
          Have questions? Our customer support team is here to help:<br/>
          <strong>📧 support@verdora.com</strong>
        </p>

        <p style="color: #475569; margin-top: 20px; text-align: center;">
          Thank you for choosing Verdora!<br/>
          <strong>🌿 Growing Green, Growing Together</strong>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="color: #888; font-size: 11px; text-align: center;">
          © 2026 Verdora. All rights reserved.
        </p>
      </div>
    `,
  });
};

