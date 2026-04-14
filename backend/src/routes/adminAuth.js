import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Vendor from "../models/Vendor.js";
import { sendOtpEmail } from "../services/emailService.js";
import { sendOtpSMS } from "../services/twilioService.js";

const router = express.Router();

// ✅ Admin/Vendor Login (Unified)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
  try {
    // Check Admin first
    let admin = await Admin.findOne({ email, status: "active" });
    if (admin) {
      const isValid = await admin.verifyPassword(password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = jwt.sign(
        { id: admin._id, email: admin.email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );
      return res.json({
        message: "Admin login successful",
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: "admin",
        },
      });
    }

    // Check Vendor
    let vendor = await Vendor.findOne({ email });
    if (vendor) {
      const isValid = await vendor.verifyPassword(password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check vendor status - MUST be active to login
      if (vendor.status === "pending") {
        return res.status(403).json({ 
          message: "Your account is pending admin approval. Please wait for approval email. Contact support@verdora.com if you have questions.",
          status: "pending",
          email: vendor.email 
        });
      }
      
      if (vendor.status === "inactive") {
        return res.status(403).json({ 
          message: "Your account has been deactivated. Please contact support@verdora.com for more information.",
          status: "inactive",
          email: vendor.email 
        });
      }
      
      // Only active vendors can login
      const token = jwt.sign(
        { id: vendor._id, email: vendor.email, role: "vendor", vendorName: vendor.vendorName },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );
      return res.json({
        message: "Vendor login successful",
        token,
        admin: {
          id: vendor._id,
          username: vendor.username,
          email: vendor.email,
          role: "vendor",
        },
      });
    }

    res.status(401).json({ message: "Invalid email or password" });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// ✅ Vendor Self-Registration (Public - no token required) - Creates pending account
router.post("/vendor/register", async (req, res) => {
  const { vendorName, mobileNumber, email, password, businessName, businessPhone, businessLocation, businessDescription, businessWebsite } = req.body;

  if (!vendorName || !mobileNumber || !email || !password || !businessName) {
    return res.status(400).json({ message: "All required fields must be provided (vendorName, mobileNumber, email, password, businessName)" });
  }

  try {
    // Check both Admin and Vendor for duplicate emails
    const existingAdmin = await Admin.findOne({ email });
    const existingVendor = await Vendor.findOne({ email });
    
    if (existingAdmin || existingVendor) {
      return res.status(400).json({ message: "Email already exists. Please use a different email address." });
    }

    // Create vendor with email as username
    const vendor = new Vendor({
      vendorName,
      mobileNumber,
      username: email, // Use email as username
      email,
      password,
      businessName,
      businessPhone: businessPhone || mobileNumber,
      businessLocation: businessLocation || "",
      businessDescription: businessDescription || "",
      businessWebsite: businessWebsite || "",
      status: "pending", // Start with pending status
    });

    await vendor.save();

    res.status(201).json({
      message: "Vendor account created successfully. Your account is pending admin approval.",
      status: "pending",
      vendor: {
        id: vendor._id,
        vendorName: vendor.vendorName,
        mobileNumber: vendor.mobileNumber,
        email: vendor.email,
        businessName: vendor.businessName,
        status: "pending",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// ✅ Admin Register (only by existing admin with admin role)
router.post("/register", async (req, res) => {
  const { username, email, password, role = "vendor" } = req.body;
  const adminToken = req.headers.authorization?.split(" ")[1];

  if (!adminToken) {
    return res
      .status(403)
      .json({ message: "Unauthorized: Admin token required" });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    const requester = await Admin.findById(decoded.id);

    if (!requester || requester.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can register new admins" });
    }

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password required" });
    }

    const existing = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = new Admin({ username, email, password, role });
    await admin.save();

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
});

// ✅ GET PENDING VENDOR REQUESTS (Admin Only) - Alias endpoint
router.get("/vendor-requests", async (req, res) => {
  const adminToken = req.headers.authorization?.split(" ")[1];
  
  if (!adminToken) {
    return res.status(401).json({ message: "Admin token required" });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const pendingVendors = await Vendor.find({ status: "pending" }).select(
      "-password"
    ).sort({ createdAt: -1 });

    res.json({
      message: "Pending vendor requests",
      count: pendingVendors.length,
      vendors: pendingVendors,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendor requests", error: err.message });
  }
});

// ✅ GET PENDING VENDOR REQUESTS (Admin Only)
router.get("/vendors/pending", async (req, res) => {
  const adminToken = req.headers.authorization?.split(" ")[1];
  
  if (!adminToken) {
    return res.status(401).json({ message: "Admin token required" });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const pendingVendors = await Vendor.find({ status: "pending" }).select(
      "-password"
    ).sort({ createdAt: -1 });

    res.json({
      message: "Pending vendor requests",
      count: pendingVendors.length,
      vendors: pendingVendors,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendors", error: err.message });
  }
});

// ✅ GET ALL VENDORS WITH STATUS (Admin Only)
router.get("/vendors/all", async (req, res) => {
  const adminToken = req.headers.authorization?.split(" ")[1];
  
  if (!adminToken) {
    return res.status(401).json({ message: "Admin token required" });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const vendors = await Vendor.find().select(
      "-password"
    ).sort({ createdAt: -1 });

    const stats = {
      total: vendors.length,
      active: vendors.filter(v => v.status === "active").length,
      pending: vendors.filter(v => v.status === "pending").length,
      inactive: vendors.filter(v => v.status === "inactive").length,
    };

    res.json({
      message: "All vendors",
      stats,
      vendors,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendors", error: err.message });
  }
});

// ✅ APPROVE VENDOR REQUEST (Admin Only)
router.post("/vendor-requests/:vendorId/approve", async (req, res) => {
  const adminToken = req.headers.authorization?.split(" ")[1];
  const { vendorId } = req.params;
  
  if (!adminToken) {
    return res.status(401).json({ message: "Admin token required" });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.status = "active";
    vendor.approvedBy = admin._id;
    vendor.approvedAt = new Date();
    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({
      message: "Vendor approved successfully",
      vendor: {
        id: vendor._id,
        email: vendor.email,
        businessName: vendor.businessName,
        status: vendor.status,
        approvedAt: vendor.approvedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve vendor", error: err.message });
  }
});

// ✅ REJECT VENDOR REQUEST (Admin Only)
router.post("/vendor-requests/:vendorId/reject", async (req, res) => {
  const adminToken = req.headers.authorization?.split(" ")[1];
  const { vendorId } = req.params;
  const { reason } = req.body;
  
  if (!adminToken) {
    return res.status(401).json({ message: "Admin token required" });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.status = "inactive";
    vendor.rejectionReason = reason || "Account rejected by admin";
    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({
      message: "Vendor request rejected successfully",
      vendor: {
        id: vendor._id,
        email: vendor.email,
        businessName: vendor.businessName,
        status: vendor.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject vendor", error: err.message });
  }
});

// ✅ APPROVE VENDOR (Admin Only)
router.patch("/vendors/:vendorId/approve", async (req, res) => {
  const adminToken = req.headers.authorization?.split(" ")[1];
  const { vendorId } = req.params;
  
  if (!adminToken) {
    return res.status(401).json({ message: "Admin token required" });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.status = "active";
    vendor.approvedBy = admin._id;
    vendor.approvedAt = new Date();
    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({
      message: "Vendor approved successfully",
      vendor: {
        id: vendor._id,
        email: vendor.email,
        username: vendor.username,
        businessName: vendor.businessName,
        status: vendor.status,
        approvedAt: vendor.approvedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve vendor", error: err.message });
  }
});

// ✅ REJECT/DEACTIVATE VENDOR (Admin Only)
router.patch("/vendors/:vendorId/reject", async (req, res) => {
  const adminToken = req.headers.authorization?.split(" ")[1];
  const { vendorId } = req.params;
  const { reason } = req.body;
  
  if (!adminToken) {
    return res.status(401).json({ message: "Admin token required" });
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(403).json({ message: "Admin not found" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.status = "inactive";
    vendor.rejectionReason = reason || "Account rejected by admin";
    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({
      message: "Vendor rejected successfully",
      vendor: {
        id: vendor._id,
        email: vendor.email,
        username: vendor.username,
        businessName: vendor.businessName,
        status: vendor.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject vendor", error: err.message });
  }
});

// ✅ Middleware to verify admin token (admin or vendor)
export const adminAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Admin token required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (
      !decoded.role ||
      (decoded.role !== "admin" && decoded.role !== "vendor")
    ) {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userName = decoded.vendorName || decoded.username;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Middleware to verify vendor token (vendor only)
export const vendorAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Vendor token required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.role || decoded.role !== "vendor") {
      return res.status(403).json({ message: "Vendor access required" });
    }
    req.vendorId = decoded.id;
    req.vendorRole = decoded.role;
    req.vendorName = decoded.vendorName;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ PASSWORD RESET - REQUEST OTP (Public - no token required)
router.post("/forgot-password", async (req, res) => {
  const { email, method = "email" } = req.body; // method: "email" or "sms"

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // Check if email exists in Admin or Vendor
    const admin = await Admin.findOne({ email });
    const vendor = await Vendor.findOne({ email });

    if (!admin && !vendor) {
      return res.status(404).json({ message: "Email not found. Please check and try again." });
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

    // Store OTP temporarily (in production, use Redis instead)
    const otpData = {
      email,
      otp,
      expiresAt: otpExpiry,
      userType: admin ? "admin" : "vendor",
    };

    // In production, store this in Redis or database
    // For now, we'll store it in memory (won't persist across server restarts)
    if (!global.otpStore) {
      global.otpStore = {};
    }
    global.otpStore[email] = otpData;

    // Send OTP via email or SMS
    try {
      if (method === "sms") {
        // Send via SMS - requires phone number
        const user = admin || vendor;
        const phoneNumber = user.mobileNumber || user.phone;
        if (phoneNumber && phoneNumber.startsWith("+")) {
          await sendOtpSMS(phoneNumber, otp);
          return res.json({
            message: "OTP sent to your phone number",
            method: "sms",
            maskedPhone: phoneNumber.replace(/(?<=.{2}).(?=.{2})/g, "*"),
          });
        } else {
          // Fall back to email if phone is not valid
          await sendOtpEmail(email, otp);
          return res.json({
            message: "OTP sent to your email",
            method: "email",
            maskedEmail: email.replace(/(?<=.{2})(.*)(?=.{2})/, (m) => "*".repeat(m.length)),
          });
        }
      } else {
        // Send via email (default)
        await sendOtpEmail(email, otp);
        return res.json({
          message: "OTP sent to your email",
          method: "email",
          maskedEmail: email.replace(/(?<=.{2})(.*)(?=.{2})/, (m) => "*".repeat(m.length)),
        });
      }
    } catch (emailError) {
      console.error("Failed to send OTP:", emailError);
      return res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to process request", error: err.message });
  }
});

// ✅ PASSWORD RESET - VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    // Check if OTP exists and is valid
    if (!global.otpStore || !global.otpStore[email]) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new OTP." });
    }

    const otpData = global.otpStore[email];

    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      delete global.otpStore[email];
      return res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    }

    // Check if OTP matches
    if (otpData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }

    // Generate temporary token for password reset (valid for 15 minutes)
    const resetToken = jwt.sign(
      { email, userType: otpData.userType, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Delete OTP after verification
    delete global.otpStore[email];

    res.json({
      message: "OTP verified successfully",
      resetToken,
      email,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify OTP", error: err.message });
  }
});

// ✅ PASSWORD RESET - RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  if (!resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long" });
  }

  try {
    // Verify reset token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Find user and update password
    let user;
    if (decoded.userType === "admin") {
      user = await Admin.findOne({ email: decoded.email });
    } else {
      user = await Vendor.findOne({ email: decoded.email });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      message: "Password reset successfully. You can now login with your new password.",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Reset token has expired. Please request a new OTP." });
    }
    res.status(500).json({ message: "Failed to reset password", error: err.message });
  }
});

export default router;
