import mongoose from "mongoose";

const ReviewImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
  },
  { _id: false },
);

const ReviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, default: null },
  orderItemId: { type: mongoose.Schema.Types.ObjectId, default: null },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true },
  comment: { type: String, trim: true },
  images: { type: [ReviewImageSchema], default: [] },
  verified: { type: Boolean, default: false }, // true if user has purchased this product
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index to ensure one review per order item
ReviewSchema.index({ orderItemId: 1 }, { unique: true, sparse: true });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
