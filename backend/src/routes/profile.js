import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Product from "../models/Product.js";
import upload from "../middleware/multerConfig.js";
import { sendOtpSMS } from "../services/twilioService.js";
import {
  sendOtpEmail,
  sendAccountDeletedEmail,
  sendVendorOrderNotificationEmail,
} from "../services/emailService.js";
import { uploadToCloudinary } from "../services/cloudinaryService.js";
import {
  generateOtp,
  isOtpExpired,
  sanitizeUser,
  validateEmail,
  validatePhone,
} from "../utils/validators.js";
import {
  calculateDeliveryEstimate,
  DEFAULT_ORIGIN_ADDRESS,
  getDefaultPlantSize,
  normalizeAddress,
} from "../utils/delivery.js";

const router = express.Router();

const ORDER_STATUSES = [
  "accepted",
  "shipped",
  "delivered",
  "returned",
  "replaced",
  "refunded",
];
const CUSTOMER_RETURN_STATUSES = ["returned", "replaced"];
const RETURN_WINDOW_DAYS = 7;

const getSafeDate = (value, fallback = new Date()) => {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : fallback;
};

const getItemStatus = (item = {}, fallbackStatus = "accepted") =>
  ORDER_STATUSES.includes(item?.status) ? item.status : fallbackStatus;

const getOrderStatusFromItems = (items = [], fallbackStatus = "accepted") => {
  const statuses = (Array.isArray(items) ? items : []).map((item) =>
    getItemStatus(item, fallbackStatus),
  );

  if (!statuses.length) {
    return fallbackStatus;
  }

  if (statuses.some((status) => status === "returned")) return "returned";
  if (statuses.some((status) => status === "replaced")) return "replaced";
  if (statuses.some((status) => status === "refunded")) return "refunded";
  if (statuses.every((status) => status === "delivered")) return "delivered";
  if (statuses.some((status) => status === "shipped")) return "shipped";

  return "accepted";
};

const getDeliveredAt = (item = {}, order = {}) =>
  getSafeDate(
    item.statusUpdatedAt ||
      order.statusUpdatedAt ||
      order.deliveryEstimate?.estimatedDeliveryDate ||
      order.date,
  );

const getReturnWindowEndsAt = (item = {}, order = {}) => {
  const deliveredAt = getDeliveredAt(item, order);
  const windowEndsAt = new Date(deliveredAt);
  windowEndsAt.setDate(windowEndsAt.getDate() + RETURN_WINDOW_DAYS);
  return windowEndsAt;
};

const canReturnOrReplaceItem = (item = {}, order = {}) => {
  if (getItemStatus(item, order.status) !== "delivered") {
    return false;
  }

  return getReturnWindowEndsAt(item, order) >= new Date();
};

const decorateOrderForResponse = (order = {}) => {
  const safeOrder = order?.toObject ? order.toObject() : order;
  const fallbackStatus = safeOrder.status || "accepted";
  const normalizedItems = (safeOrder.items || []).map((item) => {
    const normalizedStatus = getItemStatus(item, fallbackStatus);
    const statusUpdatedAt = getSafeDate(
      item?.statusUpdatedAt || safeOrder.statusUpdatedAt || safeOrder.date,
    );
    const canReview =
      normalizedStatus === "delivered" && !item?.reviewSubmitted;

    return {
      ...item,
      status: normalizedStatus,
      statusReason: item?.statusReason || "",
      returnReason: item?.returnReason || "",
      statusUpdatedAt: statusUpdatedAt.toISOString(),
      reviewSubmitted: Boolean(item?.reviewSubmitted),
      reviewId: item?.reviewId || null,
      reviewedAt: item?.reviewedAt || null,
      returnRequestImages: Array.isArray(item?.returnRequestImages)
        ? item.returnRequestImages
        : [],
      canReview,
      canReturnOrReplace: canReturnOrReplaceItem(
        { ...item, status: normalizedStatus, statusUpdatedAt },
        safeOrder,
      ),
      returnWindowEndsAt: getReturnWindowEndsAt(
        { ...item, status: normalizedStatus, statusUpdatedAt },
        safeOrder,
      ).toISOString(),
    };
  });

  return {
    ...safeOrder,
    items: normalizedItems,
    status: getOrderStatusFromItems(normalizedItems, fallbackStatus),
    statusReason: safeOrder.statusReason || "",
    returnReason: safeOrder.returnReason || "",
    statusUpdatedAt: getSafeDate(
      safeOrder.statusUpdatedAt || safeOrder.date,
    ).toISOString(),
  };
};

// ✅ Middleware to verify JWT token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ✅ Get user profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(sanitizeUser(user));
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: err.message });
  }
});

// ✅ Update single profile field (name, gender, dob)
router.patch("/update-field", authMiddleware, async (req, res) => {
  const { field, value } = req.body;
  const allowedFields = ["name", "gender", "dob"];

  if (!allowedFields.includes(field)) {
    return res.status(400).json({ message: "Cannot update this field" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { [field]: value },
      { new: true, runValidators: true },
    ).select("-password");
    res.json({
      message: "Field updated successfully",
      user: sanitizeUser(user),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update field", error: err.message });
  }
});

// ✅ Add address
router.post("/address", authMiddleware, async (req, res) => {
  const { label, address, city, state, pincode, isDefault } = req.body;

  if (!address) return res.status(400).json({ message: "Address is required" });

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If isDefault is true, unset other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      label: label || "Home",
      address,
      city,
      state,
      pincode,
      isDefault: isDefault || false,
    });
    await user.save();

    res.json({
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to add address", error: err.message });
  }
});

// ✅ Update address
router.patch("/address/:addressId", authMiddleware, async (req, res) => {
  const { label, address, city, state, pincode, isDefault } = req.body;
  const { addressId } = req.params;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const addr = user.addresses.id(addressId);
    if (!addr) return res.status(404).json({ message: "Address not found" });

    if (label) addr.label = label;
    if (address) addr.address = address;
    if (city) addr.city = city;
    if (state) addr.state = state;
    if (pincode) addr.pincode = pincode;

    if (isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
      addr.isDefault = true;
    }

    await user.save();
    res.json({
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update address", error: err.message });
  }
});

// ✅ Delete address
router.delete("/address/:addressId", authMiddleware, async (req, res) => {
  const { addressId } = req.params;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const addr = user.addresses.id(addressId);
    if (!addr) return res.status(404).json({ message: "Address not found" });

    addr.deleteOne();
    await user.save();

    res.json({
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete address", error: err.message });
  }
});

// ✅ Send OTP for email/mobile update or account deletion
// If both email and mobile exist, sends OTP to both simultaneously
router.post("/send-otp", authMiddleware, async (req, res) => {
  const { field, newValue } = req.body; // "email", "mobile", "password", or "delete"
  const otp = generateOtp();

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const sendPromises = [];
    const sentTo = [];

    // Handle email sending: prefer newValue (for users without existing email)
    if (field === "email" || field === "delete" || field === "password") {
      const targetEmail = newValue && field === "email" ? newValue : user.email;
      if (!targetEmail)
        return res.status(400).json({ message: "User email not found" });
      // If sending to new email, validate format
      if (field === "email" && newValue && !validateEmail(newValue)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      sendPromises.push(sendOtpEmail(targetEmail, otp));
      sentTo.push("email");
    }
    // Handle mobile sending: allow sending to newValue if provided
    if (field === "mobile") {
      const targetMobile = newValue ? newValue : user.mobile;
      if (!targetMobile)
        return res.status(400).json({ message: "User mobile not found" });
      if (newValue && !validatePhone(newValue)) {
        return res.status(400).json({ message: "Invalid phone format" });
      }
      const formattedMobile = targetMobile.startsWith("+")
        ? targetMobile
        : `+${targetMobile}`;
      sendPromises.push(sendOtpSMS(formattedMobile, otp));
      sentTo.push("mobile");
    } else if (field === "password" && user.mobile) {
      const formattedMobile = user.mobile.startsWith("+")
        ? user.mobile
        : `+${user.mobile}`;
      sendPromises.push(sendOtpSMS(formattedMobile, otp));
      sentTo.push("mobile");
    }

    // If neither email nor mobile for password field
    if (field === "password" && sentTo.length === 0) {
      return res.status(400).json({ message: "No email or mobile found" });
    }

    // Send OTP to all available contacts simultaneously
    await Promise.all(sendPromises);

    // Store OTP in database (expires in 10 minutes)
    user.otp = otp;
    user.otpField = field;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const message =
      sentTo.length === 2
        ? `OTP sent to email and mobile`
        : `OTP sent to ${sentTo[0]}`;
    res.json({ message });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
});

// ✅ Verify OTP and update email/mobile
router.patch("/verify-otp-update", authMiddleware, async (req, res) => {
  const { otp, newValue, field } = req.body; // field: "email" or "mobile"

  if (!["email", "mobile"].includes(field)) {
    return res.status(400).json({ message: "Invalid field" });
  }

  // Validate new value format
  if (field === "email" && !validateEmail(newValue)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (field === "mobile" && !validatePhone(newValue)) {
    return res.status(400).json({ message: "Invalid phone format" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpField !== field) {
      return res.status(400).json({ message: "OTP mismatch for this field" });
    }

    if (isOtpExpired(user.otpExpiry)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Check if new value already exists
    if (field === "email") {
      const existingUser = await User.findOne({
        email: newValue,
        _id: { $ne: req.userId },
      });
      if (existingUser)
        return res.status(400).json({ message: "Email already in use" });
    } else if (field === "mobile") {
      const existingUser = await User.findOne({
        mobile: newValue,
        _id: { $ne: req.userId },
      });
      if (existingUser)
        return res.status(400).json({ message: "Mobile already in use" });
    }

    // Update field
    user[field] = newValue;
    user.otp = null;
    user.otpField = null;
    user.otpExpiry = null;
    await user.save();

    res.json({
      message: `${field} updated successfully`,
      user: sanitizeUser(user),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update field", error: err.message });
  }
});

// ✅ Update password (OTP-based)
router.patch("/update-password", authMiddleware, async (req, res) => {
  const { newPassword, otp } = req.body;

  if (!newPassword || !otp) {
    return res.status(400).json({ message: "New password and OTP required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpField !== "password") {
      return res
        .status(400)
        .json({ message: "OTP was not requested for password update" });
    }

    if (isOtpExpired(user.otpExpiry)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpField = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update password", error: err.message });
  }
});

// ✅ Delete account with OTP verification
router.post("/delete-account", authMiddleware, async (req, res) => {
  const { otp } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpField !== "delete") {
      return res
        .status(400)
        .json({ message: "OTP was not requested for account deletion" });
    }

    if (isOtpExpired(user.otpExpiry)) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const userEmail = user.email;

    // Delete user
    await User.findByIdAndDelete(req.userId);

    // Send confirmation email
    try {
      await sendAccountDeletedEmail(userEmail);
    } catch (emailErr) {}

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete account", error: err.message });
  }
});

const resolveProductForOrderItem = async (itemId) => {
  if (!itemId) return null;

  return (
    (await Product.findById(itemId)
      .lean()
      .catch(() => null)) ||
    (await Product.findOne({ id: itemId })
      .lean()
      .catch(() => null))
  );
};

const normalizeOrderItems = async (items = [], destinationAddress) => {
  const normalizedDestination = normalizeAddress(destinationAddress);

  return Promise.all(
    (Array.isArray(items) ? items : []).map(async (item) => {
      try {
        const product = await resolveProductForOrderItem(item.id);
        const selectedSize =
          product?.plantSizes?.find(
            (size) =>
              size.id === item?.selectedSize?.id ||
              size.label === item?.selectedSize?.label,
          ) ||
          item?.selectedSize ||
          getDefaultPlantSize(
            product?.plantSizes,
            product?.price,
            product?.mrp,
          );

        const originAddress = normalizeAddress(
          item.originAddress ||
            product?.originAddress ||
            DEFAULT_ORIGIN_ADDRESS,
        );

        // Ensure selectedSize has all required fields
        const normalizedSelectedSize = selectedSize
          ? {
              id: String(selectedSize.id || "default"),
              label: String(selectedSize.label || "FREE SIZE"),
              price: Number(selectedSize.price || 0),
              mrp: Number(selectedSize.mrp || selectedSize.price || 0),
            }
          : null;

        return {
          id: String(product?._id || item.id || "").trim(),
          title: String(
            item.title || product?.name || item.name || "Product",
          ).trim(),
          name: String(
            item.name || product?.name || item.title || "Product",
          ).trim(),
          image: String(item.image || product?.image || "").trim(),
          price: Number(
            normalizedSelectedSize?.price ?? item.price ?? product?.price ?? 0,
          ),
          mrp: Number(
            normalizedSelectedSize?.mrp ?? item.mrp ?? product?.mrp ?? 0,
          ),
          quantity: Math.max(Number(item.quantity || 1), 1),
          vendorId: String(product?.vendorId || item.vendorId || "").trim(),
          vendorName: String(
            product?.vendorName || item.vendorName || "",
          ).trim(),
          selectedSize: normalizedSelectedSize
            ? {
                id: String(normalizedSelectedSize.id || "default").trim(),
                label: String(
                  normalizedSelectedSize.label || "FREE SIZE",
                ).trim(),
                price: Number(normalizedSelectedSize.price || 0),
                mrp: Number(normalizedSelectedSize.mrp || 0),
              }
            : null,
          originAddress,
          deliveryEstimate: calculateDeliveryEstimate({
            origin: originAddress,
            destination: normalizedDestination,
          }),
          status: "accepted",
          statusReason: "",
          returnReason: "",
          statusUpdatedAt: new Date(),
          reviewSubmitted: false,
          reviewId: null,
          reviewedAt: null,
        };
      } catch (itemErr) {
        throw new Error(`Failed to normalize order item: ${itemErr.message}`);
      }
    }),
  );
};

const getOverallDeliveryEstimate = (orderItems = [], destinationAddress) => {
  const estimates = orderItems
    .map((item) => item.deliveryEstimate)
    .filter((estimate) => estimate?.estimatedDeliveryDate);

  if (!estimates.length) {
    return calculateDeliveryEstimate({
      origin: DEFAULT_ORIGIN_ADDRESS,
      destination: destinationAddress,
    });
  }

  return estimates.reduce((latest, current) =>
    new Date(current.estimatedDeliveryDate) >
    new Date(latest.estimatedDeliveryDate)
      ? current
      : latest,
  );
};

// ✅ Get order history
router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("orders");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(
      (user.orders || []).map((order) => decorateOrderForResponse(order)),
    );
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: err.message });
  }
});

router.post(
  "/orders/attachments/upload",
  authMiddleware,
  upload.array("images", 4),
  async (req, res) => {
    try {
      const files = Array.isArray(req.files) ? req.files : [];
      if (!files.length) {
        return res.status(400).json({ message: "No image files provided" });
      }

      const uploadedImages = [];
      for (const file of files) {
        const result = await uploadToCloudinary(file.buffer, file.originalname);
        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }

      res.json({
        message: "Images uploaded successfully",
        images: uploadedImages,
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to upload attachment images",
        error: err.message,
      });
    }
  },
);

router.patch(
  "/orders/:orderId/items/:itemId/status",
  authMiddleware,
  async (req, res) => {
    try {
      const { action, reason, images } = req.body;

      if (!CUSTOMER_RETURN_STATUSES.includes(action)) {
        return res.status(400).json({ message: "Invalid customer action" });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const order = user.orders.id(req.params.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const item = order.items.id(req.params.itemId);
      if (!item) {
        return res.status(404).json({ message: "Order item not found" });
      }

      if (getItemStatus(item, order.status) !== "delivered") {
        return res.status(400).json({
          message: "Return or replace is available only after delivery",
        });
      }

      if (!canReturnOrReplaceItem(item, order)) {
        return res.status(400).json({
          message: `Return or replace is available for ${RETURN_WINDOW_DAYS} days after delivery`,
        });
      }

      item.status = action;
      item.statusReason = String(reason || "").trim();
      item.returnReason = String(reason || "").trim();
      item.statusUpdatedAt = new Date();
      item.returnRequestImages = Array.isArray(images)
        ? images
            .filter((image) => image?.url)
            .map((image) => ({
              url: String(image.url).trim(),
              publicId: String(image.publicId || "").trim(),
            }))
        : [];

      order.status = getOrderStatusFromItems(order.items, order.status);
      order.statusReason = `${action} requested by customer`;
      order.returnReason = String(reason || "").trim();
      order.statusUpdatedAt = new Date();

      await user.save();

      const updatedOrder = user.orders.id(req.params.orderId);
      res.json({
        message:
          action === "returned"
            ? "Return request created successfully"
            : "Replacement request created successfully",
        order: decorateOrderForResponse(updatedOrder),
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to update order item status",
        error: err.message,
      });
    }
  },
);

// ✅ Create order (save to user.orders)
// Required fields: name, mobile, email, address
router.post("/orders", authMiddleware, async (req, res) => {
  const { items, services, total, discount, addressId, couponCode } = req.body;
  try {
    // Validate incoming data
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one item is required to place an order" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Validate required fields
    if (!user.name || user.name.trim() === "") {
      return res
        .status(400)
        .json({ message: "Full Name is required to place an order" });
    }

    if (!user.email || user.email.trim() === "") {
      return res
        .status(400)
        .json({ message: "Email is required to place an order" });
    }

    if (!user.mobile || user.mobile.trim() === "") {
      return res
        .status(400)
        .json({ message: "Mobile number is required to place an order" });
    }

    if (!addressId) {
      return res
        .status(400)
        .json({ message: "Delivery address is required to place an order" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(400).json({ message: "Address not found" });
    }

    if (!address.address || address.address.trim() === "") {
      return res
        .status(400)
        .json({ message: "Delivery address is required to place an order" });
    }

    const destinationAddress = {
      label: address.label,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: "India",
    };

    const normalizedItems = await normalizeOrderItems(
      items,
      destinationAddress,
    );
    const deliveryEstimate = getOverallDeliveryEstimate(
      normalizedItems,
      destinationAddress,
    );

    const computedSubtotal = normalizedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const safeDiscount = Math.max(Number(discount || 0), 0);
    const finalTotal = Math.max(
      Number(total ?? computedSubtotal - safeDiscount),
      0,
    );

    const order = {
      items: normalizedItems,
      services: (services || []).map((s) => ({
        ...s,
        id: String(s.id || "").trim(),
        serviceSlug: String(s.serviceSlug || "").trim(),
        packageId: String(s.packageId || "").trim(),
        packageName: String(s.packageName || "").trim(),
      })),
      total: finalTotal,
      discount: safeDiscount,
      couponCode: couponCode ? String(couponCode).trim() : null,
      status: "accepted",
      statusReason: "",
      returnReason: "",
      statusUpdatedAt: new Date(),
      deliveryEstimate,
      address: {
        label: String(destinationAddress.label || "Home").trim(),
        address: String(destinationAddress.address || "").trim(),
        city: String(destinationAddress.city || "").trim(),
        state: String(destinationAddress.state || "").trim(),
        pincode: String(destinationAddress.pincode || "").trim(),
        country: "India",
      },
      mobile: String(user.mobile || "").trim(),
      email: String(user.email || "").trim(),
      name: String(user.name || "").trim(),
      date: new Date(),
    };

    // Validate order before saving
    if (!order.items || order.items.length === 0) {
      return res
        .status(400)
        .json({ message: "Order must have at least one item" });
    }

    if (typeof order.total !== "number" || order.total < 0) {
      return res.status(400).json({ message: "Invalid order total" });
    }

    user.orders = user.orders || [];

    // Clean up any existing orders with invalid status values
    user.orders = user.orders.map((existingOrder) => ({
      ...existingOrder,
      status: (existingOrder.status || "accepted").trim(),
      statusReason: String(existingOrder.statusReason || "").trim(),
      returnReason: String(existingOrder.returnReason || "").trim(),
    }));

    user.orders.push(order);

    try {
      await user.save();
    } catch (saveErr) {
      throw saveErr;
    }

    // Notify vendors whose products are included in this order
    try {
      const uniqueVendorIds = Array.from(
        new Set(
          order.items
            .map((item) => String(item.vendorId || "").trim())
            .filter(Boolean),
        ),
      );

      if (uniqueVendorIds.length > 0) {
        const vendors = await Admin.find({
          _id: { $in: uniqueVendorIds },
          role: "vendor",
        }).select("email businessName vendorName").lean();

        await Promise.allSettled(
          vendors.map((vendor) => {
            const vendorItems = order.items.filter(
              (item) => String(item.vendorId || "").trim() === String(vendor._id),
            );

            if (!vendor.email || !vendorItems.length) {
              return Promise.resolve();
            }

            return sendVendorOrderNotificationEmail(
              vendor.email,
              vendor.businessName || vendor.vendorName || "Vendor",
              String(user.orders[user.orders.length - 1]._id || order.id || ""),
              String(user.name || "Customer"),
              { email: String(user.email || ""), mobile: String(user.mobile || "") },
              order.address,
              vendorItems,
              order.total,
            );
          }),
        );
      }
    } catch (emailErr) {
      console.error("Vendor notification email failed:", emailErr);
    }

    res.json({
      message: `Order saved successfully. Delivery by ${new Date(
        deliveryEstimate.estimatedDeliveryDate,
      ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`,
      order: decorateOrderForResponse(order),
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to save order",
      error: err.message,
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

// ✅ Book a service (save service booking to user.orders)
router.post("/bookService", authMiddleware, async (req, res) => {
  const {
    serviceSlug,
    packageId,
    packageName,
    price,
    selectedDate,
    selectedTime,
    name,
    email,
    phone,
    message,
  } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate required fields
    if (
      !serviceSlug ||
      !packageId ||
      !packageName ||
      !price ||
      !selectedDate ||
      !selectedTime
    ) {
      return res
        .status(400)
        .json({ message: "All service details are required" });
    }

    // Create a service order
    const serviceOrder = {
      items: [],
      services: [
        {
          id: packageId,
          serviceSlug: serviceSlug,
          packageId: packageId,
          packageName: packageName,
          price: price,
          quantity: 1,
          selectedDate: selectedDate,
          selectedTime: selectedTime,
          message: message,
        },
      ],
      total: price,
      discount: 0,
      couponCode: null,
      status: "accepted",
      statusReason: "",
      returnReason: "",
      statusUpdatedAt: new Date(),
      deliveryEstimate: null,
      address: null, // Services may not need address
      mobile: phone,
      email: email,
      name: name,
      date: new Date(),
    };

    user.orders = user.orders || [];
    user.orders.push(serviceOrder);
    await user.save();

    res.status(201).json({
      message: "Service booked successfully!",
      order: decorateOrderForResponse(serviceOrder),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to book service", error: err.message });
  }
});

// ✅ TEST ENDPOINT: Update first order to delivered for testing review feature
router.patch("/test-order-delivered", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.orders || user.orders.length === 0) {
      return res.status(400).json({ message: "No orders found for this user" });
    }

    // Update first order to delivered for testing
    const order = user.orders[0];
    order.status = "delivered";
    order.statusUpdatedAt = new Date();
    order.items = (order.items || []).map((item) => ({
      ...item.toObject?.(),
      status: "delivered",
      statusUpdatedAt: new Date(),
    }));

    await user.save();

    res.json({
      message:
        "Order status updated to 'delivered' for testing. You can now see the 'Write a Review' button on the orders page.",
      order: {
        id: order._id,
        status: order.status,
        items: order.items.length,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update test order", error: err.message });
  }
});

export default router;
