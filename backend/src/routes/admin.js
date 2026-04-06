import express from "express";
import jwt from "jsonwebtoken";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import { ORDER_STATUSES } from "../config/constants.js";
import {
  DEFAULT_ORIGIN_ADDRESS,
  getDefaultPlantSize,
  normalizeAddress,
  normalizePlantSizes,
} from "../utils/delivery.js";

const router = express.Router();

const normalizeProductPayload = (payload = {}) => {
  const plantSizes = normalizePlantSizes(
    payload.plantSizes,
    payload.price,
    payload.mrp,
  );
  const defaultSize = getDefaultPlantSize(
    plantSizes,
    payload.price,
    payload.mrp,
  );

  return {
    ...payload,
    price: defaultSize.price,
    mrp: defaultSize.mrp,
    plantSizes,
    originAddress: normalizeAddress(
      payload.originAddress || DEFAULT_ORIGIN_ADDRESS,
    ),
  };
};

// Middleware to verify admin
const adminAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.adminId = decoded.id;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid token", error: err.message });
  }
};

// ✅ GET ADMIN STATS (Dashboard Overview)
router.get("/stats", adminAuthMiddleware, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalVendors = await Admin.countDocuments({ role: "vendor" });
    const totalAdmins = await Admin.countDocuments({ role: "admin" });

    // Get total revenue (sum of all product prices)
    const revenueData = await Product.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    res.json({
      totalProducts,
      totalUsers,
      totalVendors,
      totalAdmins,
      totalRevenue,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: err.message });
  }
});

router.get("/orders", adminAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find({ "orders.0": { $exists: true } })
      .select("name email mobile orders")
      .lean();

    const orders = users
      .flatMap((user) =>
        (user.orders || []).map((order) => ({
          id: order._id?.toString(),
          userId: user._id?.toString(),
          customer: order.name || user.name || "Customer",
          email: order.email || user.email || "",
          mobile: order.mobile || user.mobile || "",
          total: order.total || 0,
          status: order.status || "accepted",
          statusReason: order.statusReason || "",
          returnReason: order.returnReason || "",
          date: order.date,
          deliveryEstimate: order.deliveryEstimate || null,
          itemsCount:
            (order.items?.length || 0) + (order.services?.length || 0),
          items: order.items || [],
          services: order.services || [],
          address: order.address || null,
        })),
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ orders });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: err.message });
  }
});

router.patch(
  "/orders/:orderId/status",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { status, statusReason } = req.body;

      if (!ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid order status" });
      }

      const user = await User.findOne({ "orders._id": req.params.orderId });
      if (!user) {
        return res.status(404).json({ message: "Order not found" });
      }

      const order = user.orders.id(req.params.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.status = status;
      order.statusReason = statusReason || "";
      order.statusUpdatedAt = new Date();
      order.returnReason =
        status === "returned" || status === "refunded" || status === "replaced"
          ? statusReason || ""
          : "";
      order.items = (order.items || []).map((item) => ({
        ...item.toObject?.(),
        status,
        statusReason: statusReason || "",
        returnReason:
          status === "returned" ||
          status === "refunded" ||
          status === "replaced"
            ? statusReason || ""
            : "",
        statusUpdatedAt: new Date(),
      }));

      await user.save();

      res.json({
        message: "Order status updated successfully",
        order,
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to update order status", error: err.message });
    }
  },
);

// ✅ GET ALL PRODUCTS WITH SEARCH
router.get("/products", adminAuthMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 10, category } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
          { brand: { $regex: search, $options: "i" } },
          { vendorName: { $regex: search, $options: "i" } },
        ],
      };
    }
    if (category) {
      query.category = category;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      products,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
});

// ✅ GET ALL USERS WITH SEARCH
router.get("/users", adminAuthMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ],
      };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("name email mobile createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
});

// ✅ GET ALL VENDORS WITH SEARCH
router.get("/vendors", adminAuthMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { role: "vendor" };
    if (search) {
      query = {
        ...query,
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const total = await Admin.countDocuments(query);
    const vendors = await Admin.find(query)
      .select("username email businessName status createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      vendors,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch vendors", error: err.message });
  }
});

// ✅ DELETE PRODUCT
router.delete("/products/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const product =
      (await Product.findByIdAndDelete(req.params.id)) ||
      (await Product.findOneAndDelete({ id: req.params.id }));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully", product });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete product", error: err.message });
  }
});

// ✅ DELETE USER
router.delete("/users/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete user", error: err.message });
  }
});

// ✅ DELETE VENDOR
router.delete("/vendors/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const vendor = await Admin.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Also delete vendor's products
    await Product.deleteMany({ vendorId: req.params.id });

    res.json({ message: "Vendor and their products deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete vendor", error: err.message });
  }
});

// ✅ UPDATE PRODUCT
router.put("/products/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const payload = normalizeProductPayload(req.body);
    const {
      name,
      price,
      mrp,
      category,
      brand,
      description,
      vendorName,
      image,
      vendorId,
      plantSizes,
      originAddress,
    } = payload;

    // Find by _id first, then by id
    const product =
      (await Product.findByIdAndUpdate(
        req.params.id,
        {
          name,
          price,
          mrp,
          category,
          brand,
          description,
          vendorName,
          image,
          vendorId,
          plantSizes,
          originAddress,
          updatedAt: new Date(),
        },
        { new: true },
      )) ||
      (await Product.findOneAndUpdate(
        { id: req.params.id },
        {
          name,
          price,
          mrp,
          category,
          brand,
          description,
          vendorName,
          image,
          vendorId,
          plantSizes,
          originAddress,
          updatedAt: new Date(),
        },
        { new: true },
      ));

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated successfully", product });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update product", error: err.message });
  }
});

// ✅ TOGGLE VENDOR STATUS
router.patch("/vendors/:id/status", adminAuthMiddleware, async (req, res) => {
  try {
    const vendor = await Admin.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.status = vendor.status === "active" ? "inactive" : "active";
    await vendor.save();

    res.json({ message: `Vendor ${vendor.status}`, vendor });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update vendor status", error: err.message });
  }
});

// ✅ CREATE PRODUCT (ADMIN)
router.post("/products", adminAuthMiddleware, async (req, res) => {
  try {
    const payload = normalizeProductPayload(req.body);
    const {
      name,
      category,
      price,
      mrp,
      brand,
      description,
      image,
      vendorId,
      vendorName,
      plantSizes,
      originAddress,
    } = payload;

    if (!name || !category || price === undefined || mrp === undefined) {
      return res
        .status(400)
        .json({ message: "Required fields: name, category, price, mrp" });
    }

    const productId =
      Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const product = new Product({
      id: productId,
      name,
      category,
      price,
      mrp,
      brand: brand || "verdora",
      description,
      image: image || "",
      plantSizes,
      originAddress,
      vendorId: vendorId || req.adminId,
      vendorName: vendorName || "Verdora",
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create product", error: err.message });
  }
});

// ✅ UPDATE USER
router.put("/users/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { name, email, mobile } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, mobile },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update user", error: err.message });
  }
});

// ✅ CREATE USER (ADMIN)
router.post("/users", adminAuthMiddleware, async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        message: "Required fields: name, email, mobile, password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({
      name,
      email,
      mobile,
      password: await require("bcrypt").hash(password, 10),
    });

    await user.save();
    res.status(201).json({
      message: "User created successfully",
      user: { ...user.toObject(), password: undefined },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create user", error: err.message });
  }
});

// ✅ UPDATE VENDOR DETAILS
router.put("/vendors/:id/details", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      businessName,
      businessDescription,
      businessPhone,
      businessLocation,
      businessWebsite,
    } = req.body;
    const vendor = await Admin.findByIdAndUpdate(
      req.params.id,
      {
        businessName,
        businessDescription,
        businessPhone,
        businessLocation,
        businessWebsite,
        updatedAt: new Date(),
      },
      { new: true },
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ message: "Vendor details updated successfully", vendor });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update vendor details", error: err.message });
  }
});

// ✅ CREATE VENDOR (ADMIN)
router.post("/vendors", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      businessName,
      businessPhone,
      businessLocation,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Required fields: username, email, password",
      });
    }

    // Check if vendor already exists
    const existingVendor = await Admin.findOne({
      $or: [{ username }, { email }],
    });
    if (existingVendor) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    const vendor = new Admin({
      username,
      email,
      password,
      role: "vendor",
      status: "active",
      businessName: businessName || "",
      businessPhone: businessPhone || "",
      businessLocation: businessLocation || "",
      permissions: {
        canManageProducts: true,
        canManageUsers: false,
        canManageVendors: false,
        canManageAdmins: false,
        canViewReports: false,
        canManageSettings: false,
      },
    });

    await vendor.save();
    res.status(201).json({
      message: "Vendor account created successfully",
      vendor: { ...vendor.toObject(), password: undefined },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create vendor", error: err.message });
  }
});

// ✅ GET ALL ADMINS WITH SEARCH
router.get("/admins", adminAuthMiddleware, async (req, res) => {
  try {
    // Only super admins can manage admins (optional check - adjust as needed)
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { role: "admin" };
    if (search) {
      query = {
        ...query,
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    const total = await Admin.countDocuments(query);
    const adminDocs = await Admin.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Remove password from each admin object
    const admins = adminDocs.map(({ password, ...admin }) => admin);

    res.json({
      admins,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch admins", error: err.message });
  }
});

// ✅ GET SINGLE ADMIN
router.get("/admins/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json(admin);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch admin", error: err.message });
  }
});

// ✅ CREATE NEW ADMIN
router.post("/admins", adminAuthMiddleware, async (req, res) => {
  try {
    const { username, email, password, permissions } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Required fields: username, email, password",
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }],
    });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    const admin = new Admin({
      username,
      email,
      password,
      role: "admin",
      status: "active",
      permissions: permissions || {
        canManageProducts: true,
        canManageUsers: true,
        canManageVendors: true,
        canManageAdmins: false,
        canViewReports: true,
        canManageSettings: false,
      },
    });

    await admin.save();
    res.status(201).json({
      message: "Admin created successfully",
      admin: { ...admin.toObject(), password: undefined },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create admin", error: err.message });
  }
});

// ✅ UPDATE ADMIN DETAILS AND PERMISSIONS
router.put("/admins/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { username, email, status, permissions } = req.body;
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      {
        username,
        email,
        status,
        permissions,
        updatedAt: new Date(),
      },
      { new: true },
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "Admin updated successfully", admin });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update admin", error: err.message });
  }
});

// ✅ DELETE ADMIN
router.delete("/admins/:id", adminAuthMiddleware, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.adminId) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own admin account" });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete admin", error: err.message });
  }
});

// ✅ UPDATE ADMIN PERMISSIONS
router.patch(
  "/admins/:id/permissions",
  adminAuthMiddleware,
  async (req, res) => {
    try {
      const { permissions } = req.body;
      const admin = await Admin.findByIdAndUpdate(
        req.params.id,
        { permissions, updatedAt: new Date() },
        { new: true },
      ).select("-password");

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({ message: "Admin permissions updated", admin });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to update permissions", error: err.message });
    }
  },
);

// ✅ GET VENDOR DETAILS (For Vendor Dashboard)
router.get("/vendors/:id/details", async (req, res) => {
  try {
    const vendor = await Admin.findById(req.params.id).select(
      "username email businessName businessDescription businessPhone businessLocation businessWebsite businessLogo",
    );
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.json(vendor);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch vendor details", error: err.message });
  }
});

export default router;
