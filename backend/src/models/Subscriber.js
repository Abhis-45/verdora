import mongoose from "mongoose";

const SubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Subscriber || mongoose.model("Subscriber", SubscriberSchema);
