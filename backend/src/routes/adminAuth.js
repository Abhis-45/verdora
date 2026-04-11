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
    let vendor = await Vendor.findOne({ email, status: "active" });
    if (vendor) {
      const isValid = await vendor.verifyPassword(password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = jwt.sign(
        { id: vendor._id, email: vendor.email, role: "vendor" },
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

// ✅ Vendor Self-Registration (Public - no token required)
router.post("/vendor/register", async (req, res) => {
  const { vendorName, mobileNumber, username, email, password, businessName, businessPhone, businessLocation } = req.body;

  if (!vendorName || !mobileNumber || !username || !email || !password || !businessName) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  try {
    // Check both Admin and Vendor for duplicates
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    const existingVendor = await Vendor.findOne({ $or: [{ email }, { username }] });
    
    if (existingAdmin || existingVendor) {
      return res.status(400).json({ message: "Email or username already exists" });
    }

    const vendor = new Vendor({
      vendorName,
      mobileNumber,
      username,
      email,
      password,
      businessName,
      businessPhone: businessPhone || mobileNumber,
      businessLocation: businessLocation || "",
      status: "active",
    });

    await vendor.save();

    res.status(201).json({
      message: "Vendor registered successfully. Please log in.",
      vendor: {
        id: vendor._id,
        vendorName: vendor.vendorName,
        mobileNumber: vendor.mobileNumber,
        username: vendor.username,
        email: vendor.email,
        businessName: vendor.businessName,
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
