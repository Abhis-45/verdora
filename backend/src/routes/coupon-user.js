import express from "express";
import jwt from "jsonwebtoken";
import { Coupon, CouponUsage } from "../models/Coupon.js";
import User from "../models/User.js";

const router = express.Router();

// Middleware to verify user
const userAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "user") {
      return res.status(403).json({ message: "User access required" });
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", error: err.message });
  }
};

// ✅ GET AVAILABLE COUPONS TO SHOW ON CART PAGE
router.get("/available", async (req, res) => {
  try {
    const currentDate = new Date();

    const coupons = await Coupon.find({
      status: "active",
      showOnCartPage: true,
      $or: [{ expiryDate: { $gt: currentDate } }, { expiryDate: null }],
    })
      .select(
        "couponCode fixedDiscount percentageDiscount maxDiscountAmount minCartValue expiryDate"
      )
      .lean();

    res.json(coupons);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch available coupons",
        error: err.message,
      });
  }
});

// ✅ VALIDATE AND APPLY COUPON
router.post("/validate", userAuthMiddleware, async (req, res) => {
  try {
    const { couponCode, cartTotal } = req.body;

    if (!couponCode) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    if (!cartTotal) {
      return res.status(400).json({ message: "Cart total is required" });
    }

    // Find coupon
    const coupon = await Coupon.findOne({
      couponCode: couponCode.toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Check if coupon is active
    if (coupon.status !== "active") {
      return res.status(400).json({ message: "Coupon is inactive" });
    }

    // Check expiry date
    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    // Check minimum cart value
    if (cartTotal < coupon.minCartValue) {
      return res.status(400).json({
        message: `Minimum cart value of ₹${coupon.minCartValue} required`,
      });
    }

    // Check user's usage count for this coupon
    const couponUsage = await CouponUsage.findOne({
      userId: req.userId,
      couponId: coupon._id,
    });

    const usedCount = couponUsage?.usedCount || 0;
    const remainingUses = coupon.maxUsagePerUser - usedCount;

    if (remainingUses <= 0) {
      return res.status(400).json({
        message: `You have already used this coupon ${coupon.maxUsagePerUser} times`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.fixedDiscount > 0) {
      discount = coupon.fixedDiscount;
    } else if (coupon.percentageDiscount > 0) {
      discount = (cartTotal * coupon.percentageDiscount) / 100;
    }

    // Apply max discount limit
    if (coupon.maxDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }

    res.json({
      message: "Coupon applied successfully",
      coupon: {
        code: coupon.couponCode,
        discount: parseFloat(discount.toFixed(2)),
        fixedDiscount: coupon.fixedDiscount,
        percentageDiscount: coupon.percentageDiscount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minCartValue: coupon.minCartValue,
        expiryDate: coupon.expiryDate,
      },
      userUsage: {
        usedCount: usedCount,
        remainingUses: remainingUses,
        maxUsagePerUser: coupon.maxUsagePerUser,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to validate coupon",
        error: err.message,
      });
  }
});

// ✅ RECORD COUPON USAGE WHEN ORDER IS PLACED
router.post("/use", userAuthMiddleware, async (req, res) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    // Find coupon
    const coupon = await Coupon.findOne({
      couponCode: couponCode.toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Get or create coupon usage record
    let couponUsage = await CouponUsage.findOne({
      userId: req.userId,
      couponId: coupon._id,
    });

    if (couponUsage) {
      couponUsage.usedCount += 1;
      couponUsage.lastUsedAt = new Date();
    } else {
      couponUsage = new CouponUsage({
        userId: req.userId,
        couponId: coupon._id,
        usedCount: 1,
      });
    }

    await couponUsage.save();

    // Update coupon's total uses
    coupon.totalUses += 1;
    await coupon.save();

    res.json({
      message: "Coupon usage recorded successfully",
    });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to record coupon usage",
        error: err.message,
      });
  }
});

// ✅ GET USER'S COUPON USAGE STATISTICS
router.get("/user-usage", userAuthMiddleware, async (req, res) => {
  try {
    const usageStats = await CouponUsage.find({ userId: req.userId })
      .populate("couponId", "couponCode maxUsagePerUser")
      .lean();

    res.json(usageStats);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch usage statistics",
        error: err.message,
      });
  }
});

export default router;
