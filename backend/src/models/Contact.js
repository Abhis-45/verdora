import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema({
  // Contact type: 'general' (regular contact/inquiry) or 'service' (service request)
  type: { type: String, enum: ["general", "service"], default: "general" },
  
  // Common fields
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  
  // Service-specific fields
  service: { type: String, default: "" }, // Service name if type is 'service'
  servicePackage: { type: String, default: "" }, // Package name if type is 'service'
  
  // Status tracking
  submittedAt: { type: Date, default: Date.now },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  notes: { type: String }, // Admin notes
});

export default mongoose.models.Contact ||
  mongoose.model("Contact", ContactSchema);
