import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Cart Item Schema (for validation)
const cartItemSchema = {
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
  category: { type: String },
  tags: [{ type: String }],
  vendorName: { type: String },
  selectedSize: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    potPrice: { type: Number },
    potMrp: { type: Number },
    includePotByDefault: { type: Boolean }
  },
  plantSizes: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    potPrice: { type: Number },
    potMrp: { type: Number },
    includePotByDefault: { type: Boolean }
  }],
  originAddress: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String }
  },
  deliveryEstimate: {
    origin: {
      city: { type: String },
      state: { type: String }
    },
    destination: {
      city: { type: String },
      state: { type: String },
      pincode: { type: String }
    },
    distance: { type: Number },
    estimatedDeliveryDate: { type: Date },
    deliveryCharge: { type: Number }
  },
  includePot: { type: Boolean, default: false },
  cartKey: { type: String }
};

// GET /api/cart - Get user's cart
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      cart: user.cart || []
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/cart - Add item to cart
router.post("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItem = req.body;
    const cartKey = cartItem.cartKey || cartItem.productId;

    // Check if item already exists in cart
    const existingItemIndex = user.cart.findIndex(item =>
      (item.cartKey || item.productId) === cartKey
    );

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      user.cart[existingItemIndex].quantity += cartItem.quantity || 1;
    } else {
      // Add new item to cart
      user.cart.push({
        ...cartItem,
        cartKey: cartKey,
        quantity: cartItem.quantity || 1
      });
    }

    await user.save();

    res.json({
      success: true,
      message: "Item added to cart",
      cart: user.cart
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/cart/:cartKey - Update cart item quantity
router.put("/:cartKey", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { cartKey } = req.params;
    const { quantity } = req.body;

    const itemIndex = user.cart.findIndex(item =>
      (item.cartKey || item.productId) === cartKey
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      user.cart.splice(itemIndex, 1);
    } else {
      user.cart[itemIndex].quantity = quantity;
    }

    await user.save();

    res.json({
      success: true,
      message: "Cart updated",
      cart: user.cart
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/cart/:cartKey/size - Update cart item size
router.put("/:cartKey/size", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { cartKey } = req.params;
    const { nextSize, includePot } = req.body;

    const itemIndex = user.cart.findIndex(item =>
      (item.cartKey || item.productId) === cartKey
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const item = user.cart[itemIndex];

    // Update size and pot selection
    item.selectedSize = nextSize;
    item.includePot = includePot;

    // Recalculate price based on new size and pot selection
    const finalPrice = includePot && nextSize.potPrice
      ? nextSize.price + nextSize.potPrice
      : nextSize.price;
    const finalMrp = includePot && nextSize.potMrp
      ? nextSize.mrp + (nextSize.potMrp || 0)
      : nextSize.mrp;

    item.price = finalPrice;
    item.mrp = finalMrp;

    // Update cart key to reflect new size and pot selection
    const newCartKey = includePot
      ? `${item.productId}::${nextSize.id}::${nextSize.label}::with-pot`
      : `${item.productId}::${nextSize.id}::${nextSize.label}`;

    item.cartKey = newCartKey;

    await user.save();

    res.json({
      success: true,
      message: "Cart item size updated",
      cart: user.cart
    });
  } catch (error) {
    console.error("Error updating cart item size:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/cart/:cartKey - Remove item from cart
router.delete("/:cartKey", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { cartKey } = req.params;

    user.cart = user.cart.filter(item =>
      (item.cartKey || item.productId) !== cartKey
    );

    await user.save();

    res.json({
      success: true,
      message: "Item removed from cart",
      cart: user.cart
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/cart - Clear entire cart
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = [];
    await user.save();

    res.json({
      success: true,
      message: "Cart cleared",
      cart: user.cart
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/cart/:cartKey/size - Update item size (with pot support)
router.put("/:cartKey/size", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { cartKey } = req.params;
    const { nextSize, includePot } = req.body;

    const currentItemIndex = user.cart.findIndex(item =>
      (item.cartKey || item.productId) === cartKey
    );

    if (currentItemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const currentItem = user.cart[currentItemIndex];

    // Calculate final price including pot if applicable
    const finalPrice = includePot && nextSize.potPrice
      ? nextSize.price + nextSize.potPrice
      : nextSize.price;
    const finalMrp = includePot && nextSize.potMrp
      ? nextSize.mrp + (nextSize.potMrp || 0)
      : nextSize.mrp;

    const newCartKey = includePot
      ? `${currentItem.productId}::${nextSize.id}::with-pot`
      : `${currentItem.productId}::${nextSize.id}`;

    // Check if the new variant already exists
    const existingVariantIndex = user.cart.findIndex(item =>
      (item.cartKey || item.productId) === newCartKey && item !== currentItem
    );

    if (existingVariantIndex >= 0) {
      // Merge quantities
      user.cart[existingVariantIndex].quantity += currentItem.quantity;
      user.cart.splice(currentItemIndex, 1);
    } else {
      // Update the current item
      user.cart[currentItemIndex] = {
        ...currentItem,
        cartKey: newCartKey,
        selectedSize: nextSize,
        price: finalPrice,
        mrp: finalMrp,
        includePot: includePot || false
      };
    }

    await user.save();

    res.json({
      success: true,
      message: "Item size updated",
      cart: user.cart
    });
  } catch (error) {
    console.error("Error updating item size:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;