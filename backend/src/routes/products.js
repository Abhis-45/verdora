import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import {
  adminAuthMiddleware,
  vendorAuthMiddleware,
  createRoleMiddleware,
} from "../middleware/auth.js";
import upload from "../middleware/multerConfig.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinaryService.js";
import {
  DEFAULT_ORIGIN_ADDRESS,
  getDefaultPlantSize,
  normalizeAddress,
  normalizePlantSizes,
} from "../utils/delivery.js";

const router = express.Router();

// Utility to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
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

router.post(
  "/upload",
  createRoleMiddleware(["admin", "vendor"], {
    forbiddenMessage: "Admin or vendor access required",
  }),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        req.file.originalname,
      );

      res.json({
        message: "Image uploaded successfully",
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to upload image", error: err.message });
    }
  },
);

router.get("/vendor/my-products", vendorAuthMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ vendorId: req.vendorId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
});

router.get("/:id/stats", async (req, res) => {
  try {
    const productId = req.params.id;
    const result = await User.aggregate([
      { $unwind: "$orders" },
      { $unwind: "$orders.items" },
      { $match: { "orders.items.id": productId } },
      { $group: { _id: null, purchased: { $sum: "$orders.items.quantity" } } },
    ]);

    const purchased = result?.[0]?.purchased || 0;
    res.json({ purchased });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch product stats", error: err.message });
  }
});

// ===== FEATURED/FILTERED ENDPOINTS =====

// Trending Products - Daily rotation with seeded random selection
router.get("/featured/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    // Get today's date as a seed for consistent daily shuffling
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    let seed = today
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // First try to get featured products
    let products = await Product.find({ featured: true })
      .select("-createdBy")
      .limit(limit * 3)
      .lean();

    // If no featured products, get all products instead
    if (products.length === 0) {
      products = await Product.find({})
        .select("-createdBy")
        .limit(limit * 3)
        .lean();
    }

    // Seeded shuffle based on today's date
    const shuffled = products
      .sort(() => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280 - 0.5;
      })
      .slice(0, limit);

    res.json(shuffled);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch trending products",
      error: err.message,
    });
  }
});

// Products by Category
router.get("/featured/by-category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 12;

    const products = await Product.find({ category })
      .select("-createdBy")
      .limit(limit)
      .lean();

    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch category products",
      error: err.message,
    });
  }
});

// All Categories - Daily top categories with seeded shuffling
router.get("/featured/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    const categoryData = await Promise.all(
      categories.map(async (cat) => ({
        name: cat,
        count: await Product.countDocuments({ category: cat }),
        image: (await Product.findOne({ category: cat }))?.image || null,
      })),
    );

    // Seeded daily shuffle for consistent top categories throughout the day
    const today = new Date().toISOString().split("T")[0];
    let seed = today
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const shuffled = categoryData.sort(() => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280 - 0.5;
    });

    res.json(shuffled);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch categories", error: err.message });
  }
});

// Products by Characteristics
router.get("/featured/by-characteristics", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const characteristics = req.query.characteristics?.split(",") || [];

    let query = {};
    if (characteristics.length > 0) {
      query.tags = { $in: characteristics };
    }

    const products = await Product.find(query)
      .select("-createdBy")
      .limit(limit)
      .lean();

    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch characteristic products",
      error: err.message,
    });
  }
});

// Products by Color
router.get("/featured/by-color", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const color = req.query.color;

    let query = {};
    if (color) {
      query.tags = { $regex: color, $options: "i" };
    }

    const products = await Product.find(query)
      .select("-createdBy")
      .limit(limit)
      .lean();

    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch color products", error: err.message });
  }
});

// Products by Size
router.get("/featured/by-size", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const size = req.query.size;

    let query = {};
    if (size) {
      query["plantSizes.label"] = { $regex: size, $options: "i" };
    }

    const products = await Product.find(query)
      .select("-createdBy")
      .limit(limit)
      .lean();

    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch size products", error: err.message });
  }
});

// Products by Price Range
router.get("/featured/by-price", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    const minPrice = parseInt(req.query.min) || 0;
    const maxPrice = parseInt(req.query.max) || 10000;

    const products = await Product.find({
      price: { $gte: minPrice, $lte: maxPrice },
    })
      .select("-createdBy")
      .limit(limit)
      .lean();

    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch price range products",
      error: err.message,
    });
  }
});

// Premium Plants
router.get("/featured/premium", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({
      $or: [{ tags: { $in: ["premium", "rare"] } }, { mrp: { $gt: 500 } }],
    })
      .select("-createdBy")
      .sort({ mrp: -1 })
      .limit(limit)
      .lean();

    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch premium products",
      error: err.message,
    });
  }
});

// Plant Care Products
router.get("/featured/plant-care", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({
      tags: { $in: ["care", "fertilizer", "soil", "nutrients"] },
    })
      .select("-createdBy")
      .limit(limit)
      .lean();

    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch plant care products",
      error: err.message,
    });
  }
});

// Corporate/Bulk Products
router.get("/featured/corporate", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;

    const products = await Product.find({
      tags: { $in: ["bulk", "corporate", "wholesale"] },
    })
      .select("-createdBy")
      .limit(limit)
      .lean();

    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch corporate products",
      error: err.message,
    });
  }
});

// ===== MAIN ENDPOINTS =====

router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .select("-createdBy")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!id || id === "NaN" || id === "undefined") {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    let product = null;

    // Try to find by MongoDB ObjectId first
    if (isValidObjectId(id)) {
      product = await Product.findById(id).select("-createdBy").lean();
    }

    // If not found by ObjectId, try to find by custom 'id' field
    if (!product) {
      product = await Product.findOne({ id: id }).select("-createdBy").lean();
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch product", error: err.message });
  }
});

router.post("/", vendorAuthMiddleware, async (req, res) => {
  const payload = normalizeProductPayload(req.body);
  const {
    name,
    category,
    price,
    mrp,
    image,
    description,
    tags,
    brand,
    cloudinaryPublicId,
    images,
    plantSizes,
    originAddress,
  } = payload;

  if (
    !name ||
    !category ||
    price === undefined ||
    mrp === undefined ||
    !image
  ) {
    return res.status(400).json({
      message: "Required fields: name, category, price, mrp, image",
    });
  }

  try {
    const product = new Product({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      name,
      category,
      price,
      mrp,
      plantSizes,
      originAddress,
      image,
      cloudinaryPublicId: cloudinaryPublicId || "",
      images: images || [],
      description,
      tags: tags || [],
      brand: brand || "verdora",
      vendorId: req.vendorId,
      vendorName: req.vendorName,
      createdBy: req.vendorId,
    });

    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create product", error: err.message });
  }
});

router.patch("/:id", adminAuthMiddleware, async (req, res) => {
  const payload = normalizeProductPayload(req.body);
  const { id } = req.params;

  try {
    // Validate the ID format
    if (!id || id === "NaN" || id === "undefined") {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    let product = null;

    // Try to find by MongoDB ObjectId first
    if (isValidObjectId(id)) {
      product = await Product.findById(id);
    }

    // If not found by ObjectId, try to find by custom 'id' field
    if (!product) {
      product = await Product.findOne({ id: id });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Authorization check
    if (req.userRole === "vendor") {
      // For vendors: verify they own this product
      const productVendorId = product.vendorId?.toString() || product.vendorId;
      const requestVendorId = req.userId?.toString() || req.userId;
      
      if (!product.vendorId || productVendorId !== requestVendorId) {
        return res
          .status(403)
          .json({ message: "You can only update your own products" });
      }
    } else if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const allowedFields = [
      "name",
      "category",
      "price",
      "mrp",
      "image",
      "description",
      "tags",
      "brand",
      "images",
      "cloudinaryPublicId",
      "plantSizes",
      "originAddress",
    ];

    allowedFields.forEach((field) => {
      if (payload[field] !== undefined) {
        product[field] = payload[field];
      }
    });

    product.updatedAt = new Date();
    await product.save();

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update product", error: err.message });
  }
});

router.delete("/:id", adminAuthMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the ID format
    if (!id || id === "NaN" || id === "undefined") {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    let product = null;

    // Try to find by MongoDB ObjectId first
    if (isValidObjectId(id)) {
      product = await Product.findById(id);
    }

    // If not found by ObjectId, try to find by custom 'id' field
    if (!product) {
      product = await Product.findOne({ id: id });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let isAuthorized = req.userRole === "admin";
    if (
      req.userRole === "vendor" &&
      product.vendorId &&
      product.vendorId.toString() === req.userId
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "You can only delete your own products" });
    }

    try {
      if (product.cloudinaryPublicId) {
        await deleteFromCloudinary(product.cloudinaryPublicId);
      }

      if (product.images?.length) {
        for (const image of product.images) {
          if (image.publicId) {
            await deleteFromCloudinary(image.publicId);
          }
        }
      }
    } catch (cloudinaryErr) {}

    await product.deleteOne();
    res.json({ message: "Product and images deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete product", error: err.message });
  }
});

export default router;
