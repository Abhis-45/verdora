import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  fixedDiscount: {
    type: Number,
    default: 0,
    min: 0,
  },
  percentageDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  maxDiscountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  minCartValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  showOnCartPage: {
    type: Boolean,
    default: false,
  },
  maxUsagePerUser: {
    type: Number,
    default: 1,
    min: 1,
  },
  totalUses: {
    type: Number,
    default: 0,
  },
  totalDiscountGiven: {
    type: Number,
    default: 0,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const CouponUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    required: true,
  },
  usedCount: {
    type: Number,
    default: 1,
  },
  lastUsedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for unique user-coupon combination
CouponUsageSchema.index({ userId: 1, couponId: 1 }, { unique: true });

export const Coupon =
  mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);

export const CouponUsage =
  mongoose.models.CouponUsage ||
  mongoose.model("CouponUsage", CouponUsageSchema);

export default Coupon;
