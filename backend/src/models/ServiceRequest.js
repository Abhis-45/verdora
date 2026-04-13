import mongoose from "mongoose";

const ServiceRequestSchema = new mongoose.Schema({
  // Service Details
  serviceSlug: { type: String, required: true, trim: true },
  packageId: { type: String, required: true, trim: true },
  packageName: { type: String, required: true, trim: true },
  price: { type: Number, required: true },

  // Booking Schedule
  selectedDate: { type: String, required: true },
  selectedTime: { type: String, required: true },

  // Customer Information
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },

  // Additional Details
  message: { type: String, trim: true },

  // Status Tracking
  status: {
    type: String,
    enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"],
    default: "pending",
  },
  statusUpdatedAt: { type: Date, default: Date.now },

  // Admin Fields
  adminNotes: { type: String, trim: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
ServiceRequestSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.ServiceRequest ||
  mongoose.model("ServiceRequest", ServiceRequestSchema);
