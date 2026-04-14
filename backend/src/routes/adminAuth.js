import express from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Vendor from "../models/Vendor.js";

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

export default router;
