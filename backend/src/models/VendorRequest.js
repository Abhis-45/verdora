import mongoose from "mongoose";

const VendorRequestSchema = new mongoose.Schema({
  vendorName: { type: String, required: true, trim: true },
  shopName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  rejectedAt: { type: Date, default: null },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  rejectionReason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.VendorRequest ||
  mongoose.model("VendorRequest", VendorRequestSchema);
