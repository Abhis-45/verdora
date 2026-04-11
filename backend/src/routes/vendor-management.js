import express from "express";
import jwt from "jsonwebtoken";
import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { VENDOR_MANAGEABLE_STATUSES, CUSTOMER_CANCELLABLE_STATUSES } from "../config/constants.js";

const router = express.Router();

// ✅ VENDOR AUTH MIDDLEWARE
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
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ GET VENDOR PROFILE
router.get("/profile", vendorAuthMiddleware, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendorId).select("-password");
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: err.message });
  }
});

// ✅ UPDATE VENDOR PROFILE
router.put("/profile", vendorAuthMiddleware, async (req, res) => {
  try {
    const {
      vendorName,
      mobileNumber,
      businessName,
      businessDescription,
      businessPhone,
      businessLocation,
      businessWebsite,
      businessLogo,
    } = req.body;

    const vendor = await Vendor.findById(req.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    if (vendorName) vendor.vendorName = vendorName;
    if (mobileNumber) vendor.mobileNumber = mobileNumber;
    if (businessName) vendor.businessName = businessName;
    if (businessDescription) vendor.businessDescription = businessDescription;
    if (businessPhone) vendor.businessPhone = businessPhone;
    if (businessLocation) vendor.businessLocation = businessLocation;
    if (businessWebsite) vendor.businessWebsite = businessWebsite;
    if (businessLogo) vendor.businessLogo = businessLogo;

    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({ message: "Profile updated", vendor: vendor.toObject() });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

// ✅ GET VENDOR PRODUCTS
router.get("/products", vendorAuthMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.vendorId }).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
});

// ✅ CREATE PRODUCT
router.post("/products", vendorAuthMiddleware, async (req, res) => {
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
      plantSizes,
      originAddress,
      tags,
      cloudinaryPublicId,
    } = req.body;

    const product = new Product({
      id: id || Date.now().toString(),
      name,
      category,
      brand,
      price,
      mrp,
      description,
      image,
      images: images || (image ? [image] : []),
      vendorId: req.vendorId,
      plantSizes,
      originAddress,
      tags,
      cloudinaryPublicId,
      createdBy: req.vendorId,
    });

    await product.save();
    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to create product", error: err.message });
  }
});

// ✅ UPDATE PRODUCT
router.put("/products/:id", vendorAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ $or: [{ _id: id }, { id }] });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.vendorId.toString() !== req.vendorId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    Object.assign(product, req.body);
    product.updatedAt = new Date();
    await product.save();

    res.json({ message: "Product updated", product });
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
});

// ✅ DELETE PRODUCT
router.delete("/products/:id", vendorAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ $or: [{ _id: id }, { id }] });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.vendorId.toString() !== req.vendorId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
});

// ✅ GET VENDOR ORDERS
router.get("/orders", vendorAuthMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const users = await User.find({ "orders.items.vendorId": req.vendorId })
      .select("name email mobile orders")
      .lean();

    let orders = [];
    users.forEach((user) => {
      user.orders?.forEach((order) => {
        order.items?.forEach((item) => {
          if (item.vendorId === req.vendorId) {
            orders.push({
              orderId: order._id?.toString(),
              itemId: item.id,
              userId: user._id?.toString(),
              customer: user.name,
              productTitle: item.title,
              quantity: item.quantity,
              price: item.price,
              status: item.status,
              statusReason: item.statusReason,
              statusUpdatedAt: item.statusUpdatedAt,
              orderDate: order.date,
            });
          }
        });
      });
    });

    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// ✅ UPDATE ORDER ITEM STATUS (vendor can only update to shipped/delivered)
router.patch("/orders/:orderId/items/:itemId/status", vendorAuthMiddleware, async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { newStatus, reason } = req.body;

    if (!VENDOR_MANAGEABLE_STATUSES.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status for vendor" });
    }

    const user = await User.findOne({ "orders._id": orderId });
    if (!user) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = user.orders.find((o) => o._id.toString() === orderId);
    const item = order?.items.find((i) => i.id === itemId);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.vendorId !== req.vendorId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Validate status transition
    const currentStatus = item.status;
    const statusOrder = ["pending", "accepted", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = statusOrder.indexOf(newStatus);

    if (newIndex <= currentIndex) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    item.status = newStatus;
    item.statusReason = reason || "";
    item.statusUpdatedAt = new Date();

    // Update order status if all items have same status
    const itemStatuses = order.items.map((i) => i.status);
    if (itemStatuses.every((s) => s === newStatus)) {
      order.status = newStatus;
      order.statusUpdatedAt = new Date();
    }

    await user.save();
    res.json({ message: "Order status updated", item });
  } catch (err) {
    res.status(500).json({ message: "Failed to update order", error: err.message });
  }
});

// ✅ GET VENDOR STATS
router.get("/stats", vendorAuthMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.vendorId }).lean();
    const totalProducts = products.length;

    // Get vendor orders
    const users = await User.find({ "orders.items.vendorId": req.vendorId })
      .select("orders")
      .lean();

    let totalOrders = 0;
    let totalRevenue = 0;
    const orderStats = { pending: 0, accepted: 0, shipped: 0, delivered: 0, cancelled: 0 };

    users.forEach((user) => {
      user.orders?.forEach((order) => {
        order.items?.forEach((item) => {
          if (item.vendorId === req.vendorId) {
            totalOrders++;
            totalRevenue += item.price * item.quantity;
            if (orderStats.hasOwnProperty(item.status)) {
              orderStats[item.status]++;
            }
          }
        });
      });
    });

    res.json({
      totalProducts,
      totalOrders,
      totalRevenue,
      orderStats,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

// ✅ UPDATE VENDOR PASSWORD
router.post("/update-password", vendorAuthMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const vendor = await Vendor.findById(req.vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const isPasswordValid = await vendor.verifyPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    vendor.password = newPassword;
    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update password", error: err.message });
  }
});

// ✅ RESET VENDOR PASSWORD (Admin only)
router.post("/reset-password/:vendorId", async (req, res) => {
  try {
    const { newPassword, adminToken } = req.body;
    const { vendorId } = req.params;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (!adminToken) {
      return res.status(401).json({ message: "Admin token required" });
    }

    try {
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Only admins can reset vendor passwords" });
      }
    } catch (tokenErr) {
      return res.status(401).json({ message: "Invalid admin token" });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.password = newPassword;
    vendor.updatedAt = new Date();
    await vendor.save();

    res.json({ message: "Vendor password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password", error: err.message });
  }
});

export default router;
