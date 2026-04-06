import express from "express";
import Admin from "../models/Admin.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { vendorAuthMiddleware } from "./adminAuth.js";
import {
  VENDOR_MANAGEABLE_STATUSES,
  ORDER_STATUSES,
} from "../config/constants.js";
import {
  DEFAULT_ORIGIN_ADDRESS,
  getDefaultPlantSize,
  normalizeAddress,
  normalizePlantSizes,
} from "../utils/delivery.js";

const router = express.Router();
const VENDOR_VISIBLE_STATUSES = ORDER_STATUSES;

const getItemStatus = (item = {}, fallbackStatus = "accepted") =>
  VENDOR_VISIBLE_STATUSES.includes(item?.status)
    ? item.status
    : VENDOR_VISIBLE_STATUSES.includes(fallbackStatus)
      ? fallbackStatus
      : "accepted";

const getOrderStatusFromItems = (items = [], fallbackStatus = "accepted") => {
  const statuses = (items || []).map((item) =>
    getItemStatus(item, fallbackStatus),
  );
  if (!statuses.length) return fallbackStatus;
  if (statuses.every((status) => status === "delivered")) return "delivered";
  if (statuses.some((status) => status === "shipped")) return "shipped";
  return "accepted";
};

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

// ✅ GET VENDOR PROFILE
router.get("/profile", vendorAuthMiddleware, async (req, res) => {
  try {
    const vendor = await Admin.findById(req.vendorId).select(
      "username email businessName businessDescription businessPhone businessLocation businessWebsite businessLogo status",
    );

    if (!vendor) {
      return res.status(404).json({ message: "Vendor profile not found" });
    }

    res.json(vendor);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch vendor profile", error: err.message });
  }
});

// ✅ UPDATE VENDOR BUSINESS DETAILS
router.put("/profile", vendorAuthMiddleware, async (req, res) => {
  try {
    const {
      businessName,
      businessDescription,
      businessPhone,
      businessLocation,
      businessWebsite,
    } = req.body;

    const vendor = await Admin.findByIdAndUpdate(
      req.vendorId,
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

    res.json({ message: "Business details updated successfully", vendor });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update vendor profile", error: err.message });
  }
});

// ✅ GET VENDOR'S OWN PRODUCTS
router.get("/products", vendorAuthMiddleware, async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      vendorId: req.vendorId,
      ...(search && {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      }),
    };

    const products = await Product.find(query)
      .skip(Number(skip))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch vendor products", error: err.message });
  }
});

// ✅ UPDATE OWN PRODUCT
router.put("/products/:id", vendorAuthMiddleware, async (req, res) => {
  try {
    const payload = normalizeProductPayload(req.body);
    const {
      name,
      category,
      price,
      mrp,
      brand,
      description,
      plantSizes,
      originAddress,
    } = payload;

    const product = await Product.findOne({
      id: req.params.id,
      vendorId: req.vendorId,
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or unauthorized" });
    }

    // Update only allowed fields
    if (name) product.name = name;
    if (category) product.category = category;
    if (price) product.price = price;
    if (mrp) product.mrp = mrp;
    if (brand) product.brand = brand;
    if (description) product.description = description;
    if (plantSizes) product.plantSizes = plantSizes;
    if (originAddress) product.originAddress = originAddress;
    product.updatedAt = new Date();

    await product.save();

    res.json({ message: "Product updated successfully", product });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update product", error: err.message });
  }
});

// ✅ DELETE OWN PRODUCT
router.delete("/products/:id", vendorAuthMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      id: req.params.id,
      vendorId: req.vendorId,
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or unauthorized" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete product", error: err.message });
  }
});

// ✅ GET VENDOR ORDER ITEMS
router.get("/orders", vendorAuthMiddleware, async (req, res) => {
  try {
    const vendorProducts = await Product.find({ vendorId: req.vendorId })
      .select("_id id name image vendorName")
      .lean();

    const productIndex = new Map();
    vendorProducts.forEach((product) => {
      productIndex.set(String(product._id), product);
      productIndex.set(String(product.id), product);
    });

    if (!productIndex.size) {
      return res.json({ orders: [] });
    }

    const users = await User.find({ "orders.items.0": { $exists: true } })
      .select("name email mobile orders")
      .lean();

    const orders = users
      .flatMap((user) =>
        (user.orders || []).map((order) => {
          const vendorItems = (order.items || [])
            .filter((item) => {
              const itemVendorId = String(item.vendorId || "");
              if (itemVendorId && itemVendorId === String(req.vendorId)) {
                return true;
              }

              return productIndex.has(String(item.id));
            })
            .map((item) => {
              const product = productIndex.get(String(item.id));
              const normalizedStatus = getItemStatus(item, order.status);

              return {
                ...item,
                productId: String(item.id || ""),
                itemId: String(item._id || ""),
                title: item.title || product?.name || "Product",
                image: item.image || product?.image || "",
                vendorName: item.vendorName || product?.vendorName || "",
                status: normalizedStatus,
                statusReason: item.statusReason || "",
                statusUpdatedAt:
                  item.statusUpdatedAt || order.statusUpdatedAt || order.date,
              };
            });

          if (!vendorItems.length) {
            return [];
          }

          return {
            id: String(order._id || ""),
            userId: String(user._id || ""),
            customer: order.name || user.name || "Customer",
            email: order.email || user.email || "",
            mobile: order.mobile || user.mobile || "",
            date: order.date,
            address: order.address || null,
            items: vendorItems,
            itemsCount: vendorItems.length,
            vendorSubtotal: vendorItems.reduce(
              (sum, item) =>
                sum + Number(item.price || 0) * Number(item.quantity || 0),
              0,
            ),
            status: getOrderStatusFromItems(vendorItems, order.status),
          };
        }),
      )
      .flat()
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ orders });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch vendor orders",
      error: err.message,
    });
  }
});

// ✅ UPDATE VENDOR ORDER ITEM STATUS
router.patch(
  "/orders/:orderId/items/:itemId/status",
  vendorAuthMiddleware,
  async (req, res) => {
    try {
      const { status, statusReason } = req.body;

      if (!VENDOR_MANAGEABLE_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid vendor order status" });
      }

      const user = await User.findOne({ "orders._id": req.params.orderId });
      if (!user) {
        return res.status(404).json({ message: "Order not found" });
      }

      const order = user.orders.id(req.params.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const item = order.items.id(req.params.itemId);
      if (!item) {
        return res.status(404).json({ message: "Order item not found" });
      }

      let itemBelongsToVendor =
        String(item.vendorId || "") === String(req.vendorId);
      if (!itemBelongsToVendor) {
        const product =
          (await Product.findById(item.id).select("vendorId").lean()) ||
          (await Product.findOne({ id: item.id }).select("vendorId").lean());
        itemBelongsToVendor =
          String(product?.vendorId || "") === String(req.vendorId);
      }

      if (!itemBelongsToVendor) {
        return res
          .status(403)
          .json({ message: "Unauthorized order item access" });
      }

      item.status = status;
      item.statusReason = String(statusReason || "").trim();
      item.statusUpdatedAt = new Date();

      order.status = getOrderStatusFromItems(order.items, order.status);
      order.statusReason = String(statusReason || "").trim();
      order.statusUpdatedAt = new Date();

      await user.save();

      res.json({
        message: "Vendor order item updated successfully",
        item,
        orderStatus: order.status,
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to update vendor order item",
        error: err.message,
      });
    }
  },
);

// ✅ GET VENDOR DASHBOARD STATS
router.get("/stats", vendorAuthMiddleware, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({
      vendorId: req.vendorId,
    });
    const totalRevenue = await Product.aggregate([
      { $match: { vendorId: req.vendorId } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    res.json({
      totalProducts,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch vendor stats", error: err.message });
  }
});

export default router;
