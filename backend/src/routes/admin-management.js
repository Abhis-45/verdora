import express from "express";
import jwt from "jsonwebtoken";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Vendor from "../models/Vendor.js";
import Review from "../models/Review.js";
import {
  ORDER_STATUSES,
  CUSTOMER_CANCELLABLE_STATUSES,
  CUSTOMER_RETURNABLE_STATUSES,
} from "../config/constants.js";

const router = express.Router();

// ✅ ADMIN AUTH MIDDLEWARE
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
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ GET DASHBOARD STATS
router.get("/stats", adminAuthMiddleware, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    const totalVendors = await Vendor.countDocuments();
    const activeVendors = await Vendor.countDocuments({ status: "active" });

    // Calculate total revenue from orders
    const users = await User.find({ "orders.0": { $exists: true } }).lean();
    let totalRevenue = 0;
    users.forEach((user) => {
      user.orders?.forEach((order) => {
        totalRevenue += order.total || 0;
      });
    });

    // Get order statistics
    const orderStats = {
      pending: 0,
      accepted: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    };

    users.forEach((user) => {
      user.orders?.forEach((order) => {
        if (orderStats.hasOwnProperty(order.status)) {
          orderStats[order.status]++;
        }
      });
    });

    res.json({
      totalProducts,
      totalUsers,
      totalAdmins,
      totalVendors,
      activeVendors,
      totalRevenue,
      orderStats,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

// ✅ GET ALL ORDERS WITH ALL DETAILS
router.get("/orders", adminAuthMiddleware, async (req, res) => {
  try {
    const { status, vendorId } = req.query;
    const users = await User.find({ "orders.0": { $exists: true } })
      .select("name email mobile orders")
      .lean();

    let orders = [];
    users.forEach((user) => {
      user.orders?.forEach((order) => {
        order.items?.forEach((item) => {
          const order_detail = {
            orderId: order._id?.toString(),
            itemId: item.id,
            userId: user._id?.toString(),
            customer: item.name || user.name || "Customer",
            email: user.email,
            mobile: user.mobile,
            productTitle: item.title,
            productImage: item.image,
            quantity: item.quantity,
            price: item.price,
            mrp: item.mrp,
            total: item.price * item.quantity,
            vendorId: item.vendorId,
            vendorName: item.vendorName,
            status: item.status,
            statusReason: item.statusReason,
            returnReason: item.returnReason,
            statusUpdatedAt: item.statusUpdatedAt,
            orderDate: order.date,
            address: item.originAddress?.address,
            deliveryEstimate: item.deliveryEstimate?.estimatedDeliveryDate,
          };
          orders.push(order_detail);
        });
      });
    });

    // Apply filters
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }
    if (vendorId) {
      orders = orders.filter((o) => o.vendorId === vendorId);
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// ✅ UPDATE ORDER STATUS
router.patch("/orders/:orderId/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemId, newStatus, reason } = req.body;

    if (!ORDER_STATUSES.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findOne({ "orders._id": orderId });
    if (!user) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = user.orders.find((o) => o._id.toString() === orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (itemId) {
      // Update specific item
      const item = order.items.find((i) => i.id === itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      item.status = newStatus;
      item.statusReason = reason || "";
      item.statusUpdatedAt = new Date();

      // Calculate order status based on all items
      const itemStatuses = order.items.map((i) => i.status);
      const allSameStatus = itemStatuses.every((s) => s === itemStatuses[0]);
      if (allSameStatus) {
        order.status = newStatus;
        order.statusUpdatedAt = new Date();
      }
    } else {
      // Update entire order
      order.status = newStatus;
      order.statusReason = reason || "";
      order.statusUpdatedAt = new Date();

      order.items.forEach((item) => {
        item.status = newStatus;
        item.statusReason = reason || "";
        item.statusUpdatedAt = new Date();
      });
    }

    await user.save();
    res.json({ message: "Order status updated successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
});

// ✅ GET ALL PRODUCTS WITH ALL DETAILS
router.get("/products", adminAuthMiddleware, async (req, res) => {
  try {
    const { search, category, vendor } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (category) query.category = category;
    if (vendor) query.vendorId = vendor;

    const products = await Product.find(query)
      .populate("vendorId", "username businessName vendorName")
      .populate("createdBy", "username email")
      .lean();

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
});

// ✅ CREATE PRODUCT
router.post("/products", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      id,
      name,
      category,
      brand,
      price,
      mrp,
      description,
      image,
      images,
      vendorId,
      plantSizes,
      originAddress,
      tags,
      cloudinaryPublicId,
    } = req.body;

    if (!name || !category || !vendorId) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const product = new Product({
      id,
      name,
      category,
      brand,
      price,
      mrp,
      description,
      image,
      images: images || [image],
      vendorId,
      plantSizes,
      originAddress,
      tags,
      cloudinaryPublicId,
      createdBy: req.adminId,
    });

    await product.save();
    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to create product", error: err.message });
  }
});

// ✅ UPDATE PRODUCT
router.put("/products/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdOrId(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    Object.assign(product, updates);
    product.updatedAt = new Date();
    await product.save();

    res.json({ message: "Product updated", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
});

// ✅ DELETE PRODUCT
router.delete("/products/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
});

// ✅ GET ALL USERS WITH ALL DETAILS
router.get("/users", adminAuthMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email mobile dob gender addresses orders createdAt updatedAt")
      .lean();

    // Enrich with order statistics
    const enrichedUsers = users.map((user) => ({
      ...user,
      totalOrders: user.orders?.length || 0,
      totalSpent: user.orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0,
      addressCount: user.addresses?.length || 0,
    }));

    res.json(enrichedUsers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
});

// ✅ CREATE USER
router.post("/users", adminAuthMiddleware, async (req, res) => {
  try {
    const { name, email, mobile, dob, gender } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email required" });
    }

    const user = new User({
      name,
      email,
      mobile,
      dob,
      gender,
    });

    await user.save();
    res.status(201).json({ message: "User created", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
});

// ✅ UPDATE USER
router.put("/users/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, dob, gender } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;

    await user.save();
    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user", error: err.message });
  }
});

// ✅ DELETE USER
router.delete("/users/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
});

// ✅ GET ALL VENDORS WITH ALL DETAILS
router.get("/vendors", adminAuthMiddleware, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
        { vendorName: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;

    const vendors = await Vendor.find(query)
      .select("-password")
      .populate("approvedBy", "username email")
      .lean();

    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vendors", error: err.message });
  }
});

// ✅ CREATE VENDOR (by admin)
router.post("/vendors", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      vendorName,
      mobileNumber,
      businessName,
      businessDescription,
      businessPhone,
      businessLocation,
      businessWebsite,
      businessLogo,
    } = req.body;

    if (!username || !email || !password || !vendorName || !businessName) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const existing = await Vendor.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: "Vendor already exists" });
    }

    const vendor = new Vendor({
      username,
      email,
      password,
      vendorName,
      mobileNumber,
      businessName,
      businessDescription,
      businessPhone,
      businessLocation,
      businessWebsite,
      businessLogo,
      status: "active",
      approvedBy: req.adminId,
      approvedAt: new Date(),
    });

    await vendor.save();
    res.status(201).json({ message: "Vendor created", vendor: { ...vendor.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: "Failed to create vendor", error: err.message });
  }
});

// ✅ UPDATE VENDOR
router.put("/vendors/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating password or approvalstatus via this endpoint
    delete updates.password;
    delete updates.approvedBy;
    delete updates.approvedAt;

    const vendor = await Vendor.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-password");

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ message: "Vendor updated", vendor });
  } catch (err) {
    res.status(500).json({ message: "Failed to update vendor", error: err.message });
  }
});

// ✅ UPDATE VENDOR STATUS
router.patch("/vendors/:id/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const vendor = await Vendor.findByIdAndUpdate(id, { status }, { new: true }).select(
      "-password"
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ message: "Vendor status updated", vendor });
  } catch (err) {
    res.status(500).json({ message: "Failed to update vendor status", error: err.message });
  }
});

// ✅ DELETE VENDOR
router.delete("/vendors/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findByIdAndDelete(id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ message: "Vendor deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete vendor", error: err.message });
  }
});

// ✅ GET ALL ADMINS WITH ALL DETAILS
router.get("/admins", adminAuthMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const admins = await Admin.find(query)
      .select("-password")
      .lean();

    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admins", error: err.message });
  }
});

// ✅ GET SINGLE ADMIN
router.get("/admins/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findById(id).select("-password").lean();
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admin", error: err.message });
  }
});

// ✅ CREATE ADMIN
router.post("/admins", adminAuthMiddleware, async (req, res) => {
  try {
    const { username, email, password, permissions } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password required" });
    }

    const existing = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = new Admin({
      username,
      email,
      password,
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
    res.status(201).json({ message: "Admin created", admin: { ...admin.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: "Failed to create admin", error: err.message });
  }
});

// ✅ UPDATE ADMIN
router.put("/admins/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, status, permissions } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (status) admin.status = status;
    if (permissions) admin.permissions = permissions;

    await admin.save();
    res.json({ message: "Admin updated", admin: { ...admin.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: "Failed to update admin", error: err.message });
  }
});

// ✅ DELETE ADMIN
router.delete("/admins/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.adminId) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    await Admin.findByIdAndDelete(id);
    res.json({ message: "Admin deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete admin", error: err.message });
  }
});

export default router;
