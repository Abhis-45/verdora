import mongoose from "mongoose";
import bcrypt from "bcrypt";

const VendorSchema = new mongoose.Schema(
  {
    // Authentication
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // Business Details
    vendorName: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    businessName: { type: String, default: "" },
    businessDescription: { type: String, default: "" },
    businessPhone: { type: String, default: "" },
    businessLocation: { type: String, default: "" },
    businessWebsite: { type: String, default: "" },
    businessLogo: { type: String, default: "" },

    // Performance Metrics
    totalProducts: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    // Approval Status
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    approvedAt: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Hash password before saving
VendorSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  this.updatedAt = new Date();
});

// Verify password method
VendorSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.models.Vendor || mongoose.model("Vendor", VendorSchema);
