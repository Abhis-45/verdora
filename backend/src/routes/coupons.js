import express from "express";
import { Coupon, CouponUsage } from "../models/Coupon.js";
import User from "../models/User.js";
import { adminAuthMiddleware } from "../middleware/auth.js";

const router = express.Router();

// ✅ GET ALL COUPONS WITH SEARCH AND PAGINATION
router.get("/", adminAuthMiddleware, async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { couponCode: { $regex: search, $options: "i" } },
        ],
      };
    }
    if (status) {
      query.status = status;
    }

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "username email")
      .lean();

    res.json({
      coupons,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch coupons", error: err.message });
  }
});

// ✅ GET SINGLE COUPON BY ID
router.get("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).populate(
      "createdBy",
      "username email"
    );

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json(coupon);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch coupon", error: err.message });
  }
});

// ✅ CREATE NEW COUPON
router.post("/", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      couponCode,
      fixedDiscount,
      percentageDiscount,
      maxDiscountAmount,
      minCartValue,
      status,
      showOnCartPage,
      maxUsagePerUser,
      expiryDate,
    } = req.body;

    // Validate required fields
    if (!couponCode) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({
      couponCode: couponCode.toUpperCase(),
    });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    // Validate that at least one discount type is provided
    if (!fixedDiscount && !percentageDiscount) {
      return res.status(400).json({
        message: "Either fixed discount or percentage discount must be provided",
      });
    }

    // Create new coupon
    const newCoupon = new Coupon({
      couponCode: couponCode.toUpperCase(),
      fixedDiscount: fixedDiscount || 0,
      percentageDiscount: percentageDiscount || 0,
      maxDiscountAmount: maxDiscountAmount || 0,
      minCartValue: minCartValue || 0,
      status: status || "active",
      showOnCartPage: showOnCartPage || false,
      maxUsagePerUser: maxUsagePerUser || 1,
      expiryDate: expiryDate || null,
      createdBy: req.adminId,
    });

    await newCoupon.save();

    res.status(201).json({
      message: "Coupon created successfully",
      coupon: newCoupon,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create coupon", error: err.message });
  }
});

// ✅ UPDATE COUPON
router.put("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const {
      couponCode,
      fixedDiscount,
      percentageDiscount,
      maxDiscountAmount,
      minCartValue,
      status,
      showOnCartPage,
      maxUsagePerUser,
      expiryDate,
    } = req.body;

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Check if new coupon code already exists (if being changed)
    if (couponCode && couponCode.toUpperCase() !== coupon.couponCode) {
      const existingCoupon = await Coupon.findOne({
        couponCode: couponCode.toUpperCase(),
      });
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }
      coupon.couponCode = couponCode.toUpperCase();
    }

    // Update fields
    if (fixedDiscount !== undefined) coupon.fixedDiscount = fixedDiscount;
    if (percentageDiscount !== undefined)
      coupon.percentageDiscount = percentageDiscount;
    if (maxDiscountAmount !== undefined)
      coupon.maxDiscountAmount = maxDiscountAmount;
    if (minCartValue !== undefined) coupon.minCartValue = minCartValue;
    if (status !== undefined) coupon.status = status;
    if (showOnCartPage !== undefined) coupon.showOnCartPage = showOnCartPage;
    if (maxUsagePerUser !== undefined) coupon.maxUsagePerUser = maxUsagePerUser;
    if (expiryDate !== undefined) coupon.expiryDate = expiryDate;

    coupon.updatedAt = new Date();

    await coupon.save();

    res.json({
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update coupon", error: err.message });
  }
});

// ✅ DELETE COUPON
router.delete("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Also delete associated coupon usage records
    await CouponUsage.deleteMany({ couponId: req.params.id });

    res.json({
      message: "Coupon deleted successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete coupon", error: err.message });
  }
});

// ✅ GET COUPON USAGE STATS
router.get("/:id/usage", adminAuthMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const usageStats = await CouponUsage.find({ couponId: req.params.id })
      .populate("userId", "name email mobile")
      .lean();

    res.json({
      coupon,
      usageStats,
      totalUsage: usageStats.length,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch usage stats", error: err.message });
  }
});

// ✅ GET AVAILABLE COUPONS FOR USERS (To show on cart page)
router.get("/public/available", async (req, res) => {
  try {
    const currentDate = new Date();

    const coupons = await Coupon.find({
      status: "active",
      showOnCartPage: true,
      $or: [{ expiryDate: { $gt: currentDate } }, { expiryDate: null }],
    })
      .select("couponCode fixedDiscount percentageDiscount maxDiscountAmount minCartValue expiryDate")
      .lean();

    res.json(coupons);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch available coupons", error: err.message });
  }
});

export default router;
