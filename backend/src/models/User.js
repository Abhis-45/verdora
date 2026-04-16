import mongoose from "mongoose";

const ORDER_STATUSES = [
  "pending",
  "accepted",
  "cancelled",
  "shipped",
  "delivered",
  "returned",
  "replaced",
  "refunded",
];

const addressSnapshotSchema = new mongoose.Schema(
  {
    label: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    name: String,
    phone: String,
    country: { type: String, default: "India" },
  },
  { _id: false },
);

const plantSizeSnapshotSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    price: Number,
    mrp: Number,
  },
  { _id: false },
);

const deliveryEstimateSchema = new mongoose.Schema(
  {
    origin: addressSnapshotSchema,
    destination: addressSnapshotSchema,
    estimatedDeliveryDate: Date,
    transitDays: Number,
    message: String,
    calculatedAt: Date,
  },
  { _id: false },
);

const orderImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    addresses: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        label: { type: String, default: "Home" },
        address: { type: String, required: true },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        name: { type: String },
        phone: { type: String },
        isDefault: { type: Boolean, default: false },
      },
    ],
    mobile: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    orders: [
      {
        items: [
          {
            id: String,
            title: String,
            name: String,
            image: String,
            price: Number,
            mrp: Number,
            quantity: Number,
            vendorId: String,
            vendorName: String,
            selectedSize: plantSizeSnapshotSchema,
            originAddress: addressSnapshotSchema,
            deliveryEstimate: deliveryEstimateSchema,
            status: {
              type: String,
              enum: ORDER_STATUSES,
              default: "pending",
            },
            statusReason: { type: String, default: "" },
            returnReason: { type: String, default: "" },
            statusUpdatedAt: { type: Date, default: Date.now },
            trackingId: { type: String, default: "" },
            deliveryOTP: { type: String, default: "" },
            deliveryOTPExpiry: { type: Date, default: null },
            reviewSubmitted: { type: Boolean, default: false },
            reviewId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Review",
              default: null,
            },
            reviewedAt: { type: Date, default: null },
            returnRequestImages: { type: [orderImageSchema], default: [] },
          },
        ],
        services: [
          {
            id: String,
            serviceSlug: String,
            packageId: String,
            packageName: String,
            price: Number,
            quantity: Number,
            selectedDate: String,
            selectedTime: String,
            image: String,
          },
        ],
        total: Number,
        discount: Number,
        couponCode: String,
        status: {
          type: String,
          enum: ORDER_STATUSES,
          default: "pending",
        },
        statusReason: { type: String, default: "" },
        returnReason: { type: String, default: "" },
        statusUpdatedAt: { type: Date, default: Date.now },
        deliveryEstimate: deliveryEstimateSchema,
        address: addressSnapshotSchema,
        mobile: String,
        email: String,
        name: String,
        date: { type: Date, default: Date.now },
      },
    ],
    otp: { type: String },
    otpExpiry: { type: Date },
    otpField: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", userSchema);
