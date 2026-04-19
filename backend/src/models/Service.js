import mongoose from "mongoose";

const PackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  desc: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
}, { _id: true });

const ServiceSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  title: { type: String, required: true, trim: true },
  desc: { type: String, required: true, trim: true },
  details: { type: String, required: true, trim: true },
  image: { type: String, default: "/images/placeholder.jpg" },
  packages: [PackageSchema],
  
  // Status
  isActive: { type: Boolean, default: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema);
