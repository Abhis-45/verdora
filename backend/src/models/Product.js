import mongoose from "mongoose";
import { DEFAULT_ORIGIN_ADDRESS } from "../utils/delivery.js";

const PlantSizeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const OriginAddressSchema = new mongoose.Schema(
  {
    address: { type: String, default: "" },
    city: { type: String, default: DEFAULT_ORIGIN_ADDRESS.city },
    state: { type: String, default: DEFAULT_ORIGIN_ADDRESS.state },
    pincode: { type: String, default: DEFAULT_ORIGIN_ADDRESS.pincode },
    country: { type: String, default: DEFAULT_ORIGIN_ADDRESS.country },
  },
  { _id: false },
);

const ProductSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    default: () =>
      Date.now().toString() + Math.random().toString(36).slice(2, 7),
  },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  plantSizes: {
    type: [PlantSizeSchema],
    default: () => [
      {
        id: "m-default",
        label: "M",
        price: 0,
        mrp: 0,
        isDefault: true,
      },
    ],
  },
  originAddress: {
    type: OriginAddressSchema,
    default: () => ({ ...DEFAULT_ORIGIN_ADDRESS }),
  },
  image: { type: String, required: true },
  cloudinaryPublicId: { type: String, default: "" },
  images: [
    {
      url: String,
      publicId: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  description: { type: String, default: "" },
  tags: [{ type: String }],
  brand: { type: String, default: "verdora" },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  vendorName: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
