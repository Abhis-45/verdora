import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  submittedAt: { type: Date, default: Date.now },
  isResolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
  notes: { type: String }, // Admin notes
});

export default mongoose.models.Contact ||
  mongoose.model("Contact", ContactSchema);
