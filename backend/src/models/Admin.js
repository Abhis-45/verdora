import mongoose from "mongoose";
import bcrypt from "bcrypt";

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "vendor"], default: "vendor" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  // Vendor Business Details
  vendorName: { type: String, default: "" },
  mobileNumber: { type: String, default: "" },
  businessName: { type: String, default: "" },
  businessDescription: { type: String, default: "" },
  businessPhone: { type: String, default: "" },
  businessLocation: { type: String, default: "" },
  businessWebsite: { type: String, default: "" },
  businessLogo: { type: String, default: "" },
  // Admin Permissions
  permissions: {
    canManageProducts: { type: Boolean, default: true },
    canManageUsers: { type: Boolean, default: true },
    canManageVendors: { type: Boolean, default: true },
    canManageAdmins: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: true },
    canManageSettings: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
AdminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  this.updatedAt = new Date();
});

// Verify password method
AdminSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
