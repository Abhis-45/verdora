import express from "express";
import jwt from "jsonwebtoken";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Vendor from "../models/Vendor.js";
import VendorRequest from "../models/VendorRequest.js";
import Review from "../models/Review.js";
import ServiceRequest from "../models/ServiceRequest.js";
import { ORDER_STATUSES } from "../config/constants.js";
import {
  DEFAULT_ORIGIN_ADDRESS,
  getDefaultPlantSize,
  normalizeAddress,
  normalizePlantSizes,
} from "../utils/delivery.js";
import { deleteFromCloudinary } from "../services/cloudinaryService.js";
import {
  sendUserOrderShippedEmail,
  sendUserOrderDeliveredEmail,
  sendUserOrderCancelledEmail,
  sendUserRefundProcessedEmail,
  sendVendorApprovedEmail,
  sendVendorRejectedEmail,
  sendVendorRegistrationSubmittedEmail,
} from "../services/emailService.js";
import {
  sendOrderShippedSMS,
  sendOrderDeliveredSMS,
  sendOrderCancelledSMS,
  sendRefundProcessedSMS,
  sendVendorApprovedSMS,
  sendVendorRejectedSMS,
  sendVendorRegistrationReceivedSMS,
} from "../services/twilioService.js";

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
    const totalVendors = await Vendor.countDocuments();
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

      // ✅ SEND STATUS UPDATE NOTIFICATIONS TO USER
      try {
        const estimatedDelivery = order.deliveryEstimate?.estimatedDeliveryDate
          ? new Date(order.deliveryEstimate.estimatedDeliveryDate).toLocaleDateString()
          : "2-5 business days";

        // Send email notification
        if (user.email && status !== "accepted") {
          let emailFn = null;
          if (status === "shipped") {
            emailFn = () => sendUserOrderShippedEmail(
              user.email,
              user.name || "Valued Customer",
              String(order._id || ""),
              "",
              estimatedDelivery
            );
          } else if (status === "delivered") {
            emailFn = () => sendUserOrderDeliveredEmail(
              user.email,
              user.name || "Valued Customer",
              String(order._id || "")
            );
          } else if (status === "refunded") {
            emailFn = () => sendUserRefundProcessedEmail(
              user.email,
              user.name || "Valued Customer",
              String(order._id || ""),
              order.total || 0
            );
          }

          if (emailFn) {
            await emailFn().catch((err) => 
              console.error(`❌ Order ${status} email failed:`, err.message)
            );
          }
        }

        // Send SMS notification
        if (user.mobile && status !== "accepted") {
          const formattedMobile = user.mobile.startsWith("+")
            ? user.mobile
            : `+91${user.mobile}`;

          if (status === "shipped") {
            await sendOrderShippedSMS(
              formattedMobile,
              String(order._id || ""),
              estimatedDelivery
            ).catch((err) => console.error("❌ Order shipped SMS failed:", err.message));
          } else if (status === "delivered") {
            await sendOrderDeliveredSMS(
              formattedMobile,
              String(order._id || "")
            ).catch((err) => console.error("❌ Order delivered SMS failed:", err.message));
          } else if (status === "refunded") {
            await sendRefundProcessedSMS(
              formattedMobile,
              String(order._id || ""),
              order.total || 0
            ).catch((err) => console.error("❌ Refund SMS failed:", err.message));
          }
        }
      } catch (notificationErr) {
        console.error("Order status notification failed:", notificationErr.message);
        // Don't fail the request due to notification errors
      }

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
      .populate("vendorId", "username email businessName")
      .populate("createdBy", "username email")
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

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { businessName: { $regex: search, $options: "i" } },
        ],
      };
    }

    const total = await Vendor.countDocuments(query);
    const vendors = await Vendor.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-password")
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

// ✅ DELETE PRODUCT WITH CASCADE (Images + Reviews)
router.delete("/products/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let product = null;
    let error = null;

    // Strategy 1: Try to find by custom 'id' field
    try {
      product = await Product.findOne({ id: String(id) });
    } catch (err1) {
      error = err1;
      console.error("Error finding by custom id:", err1);
    }

    // Strategy 2: If not found, try MongoDB ObjectId
    if (!product && !error && id.length === 24) {
      try {
        product = await Product.findById(id);
      } catch (err2) {
        error = err2;
        console.error("Error finding by ObjectId:", err2);
      }
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // CASCADE: Delete all product images from Cloudinary (skip if fails)
    let imagesDeleted = 0;
    try {
      if (product.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(product.cloudinaryPublicId);
          imagesDeleted++;
        } catch (imgErr) {
          console.warn("Warning: Failed to delete main image:", imgErr.message);
        }
      }

      // Delete all additional product images
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        for (const image of product.images) {
          if (image.publicId) {
            try {
              await deleteFromCloudinary(image.publicId);
              imagesDeleted++;
            } catch (imgErr) {
              console.warn("Warning: Failed to delete image:", imgErr.message);
            }
          }
        }
      }
    } catch (imgErr) {
      console.warn("Warning: Image cleanup failed:", imgErr.message);
    }

    // CASCADE: Delete all reviews for this product (skip if fails)
    let reviewsDeleted = 0;
    try {
      const reviewResult = await Review.deleteMany({ productId: product._id });
      reviewsDeleted = reviewResult.deletedCount || 0;
    } catch (reviewErr) {
      console.warn("Warning: Failed to delete reviews:", reviewErr.message);
    }

    // Delete the product - MAIN deletion
    let deletedProduct = null;
    try {
      deletedProduct = await Product.findOneAndDelete({ id: String(id) });
    } catch (err) {
      console.error("Fallback: trying findByIdAndDelete");
      deletedProduct = await Product.findByIdAndDelete(product._id);
    }

    if (!deletedProduct) {
      return res.status(500).json({ message: "Failed to delete product from database" });
    }

    res.json({ 
      message: "✅ Product and all associated data deleted successfully", 
      deletedCount: 1,
      relatedDataDeleted: {
        images: imagesDeleted,
        reviews: reviewsDeleted
      }
    });
  } catch (err) {
    console.error("Delete product fatal error:", err);
    res.status(500).json({ 
      message: "Failed to delete product", 
      error: err.message,
      hint: "Check server logs for details"
    });
  }
});

// ✅ DELETE USER WITH CASCADE (Orders + Reviews + Profile)
router.delete("/users/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // CASCADE: Delete user's reviews
    const reviewsDeleted = await Review.deleteMany({ userId: req.params.id });

    // User's order data is embedded in the User document, so it's deleted with user.findByIdAndDelete
    const ordersCount = user.orders?.length || 0;

    res.json({ 
      message: "✅ User and all associated data deleted successfully",
      deletedCount: 1,
      relatedDataDeleted: {
        profile: "deleted",
        orders: ordersCount,
        reviews: reviewsDeleted.deletedCount || 0
      }
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ 
      message: "Failed to delete user", 
      error: err.message 
    });
  }
});

// ✅ DELETE VENDOR WITH CASCADE (Products + Images + Reviews + Business Details)
router.delete("/vendors/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // CASCADE: Get all vendor's products for image cleanup
    const vendorProducts = await Product.find({ vendorId: req.params.id });

    // Delete all images from Cloudinary for all vendor products
    let imagesDeleted = 0;
    for (const product of vendorProducts) {
      if (product.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(product.cloudinaryPublicId);
          imagesDeleted++;
        } catch (imgErr) {
          console.warn("Warning: Failed to delete image:", imgErr.message);
        }
      }
      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          if (image.publicId) {
            try {
              await deleteFromCloudinary(image.publicId);
              imagesDeleted++;
            } catch (imgErr) {
              console.warn("Warning: Failed to delete image:", imgErr.message);
            }
          }
        }
      }
    }

    // CASCADE: Delete all reviews for vendor's products
    const vendorProductIds = vendorProducts.map((p) => p._id);
    const reviewsDeleted = await Review.deleteMany({ productId: { $in: vendorProductIds } });

    // CASCADE: Delete all vendor's products
    await Product.deleteMany({ vendorId: req.params.id });

    res.json({ 
      message: "✅ Vendor and all associated data deleted successfully",
      deletedCount: {
        vendor: 1,
        products: vendorProducts.length,
      },
      relatedDataDeleted: {
        businessDetails: "deleted",
        products: vendorProducts.length,
        images: imagesDeleted,
        reviews: reviewsDeleted.deletedCount || 0
      }
    });
  } catch (err) {
    console.error("Delete vendor error:", err);
    res.status(500).json({ 
      message: "Failed to delete vendor", 
      error: err.message 
    });
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
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.status = vendor.status === "active" ? "inactive" : "active";
    await vendor.save();

    res.json({ message: `Vendor ${vendor.status}`, vendor: { ...vendor.toObject(), password: undefined } });
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
    const vendor = await Vendor.findByIdAndUpdate(
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
    ).select("-password");

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
      vendorName,
      mobileNumber,
      businessName,
      businessPhone,
      businessLocation,
      businessWebsite,
    } = req.body;

    if (!username || !email || !password || !businessName) {
      return res.status(400).json({
        message: "Required fields: username, email, password, businessName",
      });
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
    });
    if (existingVendor) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    const vendor = new Vendor({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      vendorName: vendorName?.trim() || "",
      mobileNumber: mobileNumber?.trim() || "",
      businessName: businessName.trim(),
      businessPhone: businessPhone?.trim() || "",
      businessLocation: businessLocation?.trim() || "",
      businessWebsite: businessWebsite?.trim() || "",
      status: "active",
      approvedBy: req.adminId,
      approvedAt: new Date(),
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
    const vendor = await Vendor.findById(req.params.id).select(
      "username email vendorName mobileNumber businessName businessDescription businessPhone businessLocation businessWebsite businessLogo",
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

// ✅ GET VENDOR REQUESTS (All vendor registrations with full data)
router.get("/vendor-requests", adminAuthMiddleware, async (req, res) => {
  try {
    const requests = await VendorRequest.find()
      .populate("approvedBy", "username email")
      .populate("rejectedBy", "username email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch vendor requests",
        error: err.message,
      });
  }
});

// ✅ GET SINGLE VENDOR REQUEST
router.get("/vendor-requests/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const request = await VendorRequest.findById(req.params.id)
      .populate("approvedBy", "username email")
      .populate("rejectedBy", "username email")
      .lean();

    if (!request) {
      return res.status(404).json({ message: "Vendor request not found" });
    }

    res.json(request);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch vendor request",
        error: err.message,
      });
  }
});

// ✅ APPROVE VENDOR REQUEST
router.post("/vendor-requests/:id/approve", adminAuthMiddleware, async (req, res) => {
  try {
    const vendorRequest = await VendorRequest.findById(req.params.id);

    if (!vendorRequest) {
      return res.status(404).json({ message: "Vendor request not found" });
    }

    if (vendorRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending requests can be approved" });
    }

    // Update vendor request status
    vendorRequest.status = "approved";
    vendorRequest.approvedAt = new Date();
    vendorRequest.approvedBy = req.adminId;
    await vendorRequest.save();

    // ✅ SEND APPROVAL NOTIFICATION
    try {
      if (vendorRequest.email) {
        await sendVendorApprovedEmail(
          vendorRequest.email,
          vendorRequest.vendorName || "Valued Vendor",
          vendorRequest.businessName || vendorRequest.shopName || "Business",
          "https://verdora.com/vendor/login"
        ).catch((err) => console.error("❌ Vendor approval email failed:", err.message));

        const formattedPhone = vendorRequest.phone?.startsWith("+")
          ? vendorRequest.phone
          : `+91${vendorRequest.phone}`;
        
        await sendVendorApprovedSMS(
          formattedPhone,
          vendorRequest.vendorName || "Valued Vendor"
        ).catch((err) => console.error("❌ Vendor approval SMS failed:", err.message));
      }
    } catch (notificationErr) {
      console.error("Vendor approval notification failed:", notificationErr.message);
    }

    res.json({
      message: "Vendor request approved",
      vendorRequest,
    });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to approve vendor request",
        error: err.message,
      });
  }
});

// ✅ REJECT VENDOR REQUEST
router.post(
  "/vendor-requests/:id/reject",
  adminAuthMiddleware,
  async (req, res) => {
    const { rejectionReason } = req.body;

    try {
      const vendorRequest = await VendorRequest.findById(req.params.id);

      if (!vendorRequest) {
        return res.status(404).json({ message: "Vendor request not found" });
      }

      if (vendorRequest.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Only pending requests can be rejected" });
      }

      // Update vendor request status
      vendorRequest.status = "rejected";
      vendorRequest.rejectedAt = new Date();
      vendorRequest.rejectedBy = req.adminId;
      vendorRequest.rejectionReason = rejectionReason || "";
      await vendorRequest.save();

      // ✅ SEND REJECTION NOTIFICATION
      try {
        if (vendorRequest.email) {
          await sendVendorRejectedEmail(
            vendorRequest.email,
            vendorRequest.vendorName || "Valued Vendor",
            vendorRequest.businessName || vendorRequest.shopName || "Business",
            rejectionReason || "Your application does not meet our requirements at this time."
          ).catch((err) => console.error("❌ Vendor rejection email failed:", err.message));

          const formattedPhone = vendorRequest.phone?.startsWith("+")
            ? vendorRequest.phone
            : `+91${vendorRequest.phone}`;
          
          await sendVendorRejectedSMS(
            formattedPhone,
            vendorRequest.vendorName || "Valued Vendor"
          ).catch((err) => console.error("❌ Vendor rejection SMS failed:", err.message));
        }
      } catch (notificationErr) {
        console.error("Vendor rejection notification failed:", notificationErr.message);
      }

      res.json({
        message: "Vendor request rejected",
        vendorRequest,
      });
    } catch (err) {
      res
        .status(500)
        .json({
          message: "Failed to reject vendor request",
          error: err.message,
        });
    }
  }
);

// ✅ ACCEPT VENDOR REQUEST & CREATE VENDOR ACCOUNT
router.post("/vendor-requests/:id/accept-with-vendor", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      password,
      vendorName,
      mobileNumber,
      businessName,
      businessPhone,
      businessLocation,
    } = req.body;

    console.log("📥 Creating vendor with data:", {
      username,
      email,
      vendorName,
      mobileNumber,
      businessName,
      businessPhone,
      businessLocation,
    });

    // Validate required fields
    if (!username || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("❌ Invalid email format:", email);
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate username format (alphanumeric and underscore, 3+ chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    if (!usernameRegex.test(username)) {
      console.log("❌ Invalid username format:", username);
      return res.status(400).json({ message: "Username must be 3+ characters (alphanumeric and underscore only)" });
    }

    // Validate password length
    if (password.length < 6) {
      console.log("❌ Password too short");
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Get vendor request
    const vendorRequest = await VendorRequest.findById(id);
    if (!vendorRequest) {
      console.log("❌ Vendor request not found:", id);
      return res.status(404).json({ message: "Vendor request not found" });
    }

    // Allow both pending and approved status
    if (vendorRequest.status !== "pending" && vendorRequest.status !== "approved") {
      console.log("❌ Vendor request status is not pending or approved:", vendorRequest.status);
      return res.status(400).json({ message: "Only pending or approved requests can be accepted. Current status: " + vendorRequest.status });
    }

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
    if (existingVendor) {
      console.log("❌ Vendor already exists");
      if (existingVendor.email === email.toLowerCase()) {
        return res.status(400).json({ message: "A vendor with this email already exists" });
      }
      return res.status(400).json({ message: "A vendor with this username already exists" });
    }

    // Check if email already in another vendor request
    const otherRequest = await VendorRequest.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
    if (otherRequest) {
      console.log("❌ Email already in another vendor request");
      return res.status(400).json({ message: "This email is already in another vendor request" });
    }

    // Create vendor account
    const vendor = new Vendor({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      vendorName: vendorName?.trim() || "",
      mobileNumber: mobileNumber?.trim() || "",
      businessName: businessName?.trim() || "",
      businessPhone: businessPhone?.trim() || "",
      businessLocation: businessLocation?.trim() || "",
      status: "active",
      approvedBy: req.adminId,
      approvedAt: new Date(),
    });

    await vendor.save();
    console.log(`✅ Vendor created: ${vendor.username} (${vendor.email})`);

    // Update vendor request status
    vendorRequest.status = "approved";
    vendorRequest.approvedAt = new Date();
    vendorRequest.approvedBy = req.adminId;
    await vendorRequest.save();
    console.log(`✅ Vendor request updated: ${id} -> approved`);

    res.status(201).json({
      message: "Vendor request accepted and vendor account created successfully",
      vendor: { ...vendor.toObject(), password: undefined },
      vendorRequest,
    });
  } catch (err) {
    console.error("❌ Error accepting vendor request and creating vendor:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({
      message: "Failed to accept vendor request and create vendor account",
      error: err.message,
    });
  }
});

// ✅ CREATE VENDOR ACCOUNT (Admin creates vendor)
router.post("/create-vendor", adminAuthMiddleware, async (req, res) => {
  const {
    username,
    email,
    password,
    vendorName,
    businessName,
    businessPhone,
    businessLocation,
    businessWebsite,
  } = req.body;

  if (!username || !email || !password || !businessName) {
    return res
      .status(400)
      .json({
        message: "Username, email, password, and business name are required",
      });
  }

  try {
    // Check if vendor already exists
    const existing = await Vendor.findOne({ $or: [{ email: email.toLowerCase().trim() }, { username: username.toLowerCase().trim() }] });
    if (existing) {
      return res
        .status(400)
        .json({ message: "A vendor with this email or username already exists" });
    }

    // Create new vendor account
    const vendor = new Vendor({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      vendorName: vendorName.trim(),
      mobileNumber: "", // Can be added if needed
      businessName: businessName.trim(),
      businessPhone: businessPhone.trim(),
      businessLocation: businessLocation.trim(),
      businessWebsite: businessWebsite.trim(),
      status: "active",
      approvedBy: req.adminId,
      approvedAt: new Date(),
    });

    await vendor.save();

    res.json({
      message: "Vendor account created successfully",
      vendor: { ...vendor.toObject(), password: undefined },
    });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to create vendor account",
        error: err.message,
      });
  }
});

// ✅ DELETE VENDOR REQUEST
router.delete("/vendor-requests/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendorRequest = await VendorRequest.findByIdAndDelete(id);
    if (!vendorRequest) {
      return res.status(404).json({ message: "Vendor request not found" });
    }

    res.json({ message: "Vendor request deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete vendor request",
      error: err.message,
    });
  }
});

// ✅ GET ALL SERVICE REQUESTS
router.get("/service-requests", adminAuthMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) {
      query.status = status;
    }

    const serviceRequests = await ServiceRequest.find(query)
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ServiceRequest.countDocuments(query);

    res.json({
      serviceRequests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch service requests",
      error: err.message,
    });
  }
});

// ✅ GET SINGLE SERVICE REQUEST
router.get("/service-requests/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate("assignedTo", "name email")
      .lean();

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    res.json(serviceRequest);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch service request",
      error: err.message,
    });
  }
});

// ✅ UPDATE SERVICE REQUEST STATUS & NOTES
router.patch("/service-requests/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { status, adminNotes, assignedTo } = req.body;
    const { id } = req.params;

    const updateData = {};
    if (status) {
      updateData.status = status;
      updateData.statusUpdatedAt = new Date();
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    const serviceRequest = await ServiceRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("assignedTo", "name email");

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    res.json({
      message: "Service request updated successfully",
      serviceRequest,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update service request",
      error: err.message,
    });
  }
});

// ✅ DELETE SERVICE REQUEST
router.delete("/service-requests/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const serviceRequest = await ServiceRequest.findByIdAndDelete(id);
    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }

    res.json({ message: "Service request deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete service request",
      error: err.message,
    });
  }
});

// ✅ GET SERVICE REQUESTS STATS
router.get("/stats/service-requests", adminAuthMiddleware, async (req, res) => {
  try {
    const total = await ServiceRequest.countDocuments();
    const pending = await ServiceRequest.countDocuments({ status: "pending" });
    const confirmed = await ServiceRequest.countDocuments({ status: "confirmed" });
    const inProgress = await ServiceRequest.countDocuments({ status: "in-progress" });
    const completed = await ServiceRequest.countDocuments({ status: "completed" });
    const cancelled = await ServiceRequest.countDocuments({ status: "cancelled" });

    // Get total revenue from services
    const revenueData = await ServiceRequest.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    res.json({
      total,
      pending,
      confirmed,
      inProgress,
      completed,
      cancelled,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch service request stats",
      error: err.message,
    });
  }
});

export default router;
