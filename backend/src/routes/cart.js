import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const getItemKey = (item = {}) => item.cartKey || item.productId;

const buildBaseCartKey = (item = {}, size = {}) =>
  `${item.productId}::${size.id || size.label || "default"}::${size.label || "default"}`;

const normalizePotSelection = (size = {}, includePot = false, selectedPotOption = null) => {
  const supportsPot = Number(size?.potPrice || 0) > 0;
  if (!supportsPot || !includePot) {
    return {
      includePot: false,
      selectedPotOption: null,
      potPrice: 0,
      potMrp: 0,
    };
  }

  if (selectedPotOption?.name) {
    return {
      includePot: true,
      selectedPotOption: {
        name: String(selectedPotOption.name),
        price: Number(selectedPotOption.price || 0),
        mrp: Number(selectedPotOption.mrp || 0),
        image: String(selectedPotOption.image || ""),
      },
      potPrice: Number(selectedPotOption.price || 0),
      potMrp: Number(selectedPotOption.mrp || 0),
    };
  }

  const fallback = {
    name: String(size.potName || "Default Pot"),
    price: Number(size.potPrice || 0),
    mrp: Number(size.potMrp || 0),
    image: String(size.potImage || ""),
  };

  return {
    includePot: true,
    selectedPotOption: fallback,
    potPrice: fallback.price,
    potMrp: fallback.mrp,
  };
};

const buildVariantCartKey = (item = {}, size = {}, includePot = false, selectedPotOption = null) => {
  const baseKey = buildBaseCartKey(item, size);
  if (!includePot) {
    return baseKey;
  }
  const potToken = selectedPotOption?.name || "default";
  return `${baseKey}::with-pot::${potToken}`;
};

const mergeOrReplaceCartItem = (cart = [], currentIndex, nextItem, nextKey) => {
  const withoutCurrent = cart.filter((_, index) => index !== currentIndex);
  const existingIndex = withoutCurrent.findIndex((item) => getItemKey(item) === nextKey);

  if (existingIndex >= 0) {
    withoutCurrent[existingIndex].quantity += Number(nextItem.quantity || 1);
    return withoutCurrent;
  }

  return [...withoutCurrent, nextItem];
};

router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      cart: user.cart || [],
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItem = req.body || {};
    const cartKey = String(cartItem.cartKey || cartItem.productId || "");
    if (!cartKey) {
      return res.status(400).json({ message: "Invalid cart item key" });
    }

    const existingItemIndex = user.cart.findIndex(
      (item) => getItemKey(item) === cartKey,
    );

    if (existingItemIndex >= 0) {
      user.cart[existingItemIndex].quantity += Number(cartItem.quantity || 1);
    } else {
      user.cart.push({
        ...cartItem,
        cartKey,
        quantity: Number(cartItem.quantity || 1),
      });
    }

    await user.save();

    res.json({
      success: true,
      message: "Item added to cart",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:cartKey", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { cartKey } = req.params;
    const { quantity } = req.body;

    const itemIndex = user.cart.findIndex(
      (item) => getItemKey(item) === cartKey,
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    if (Number(quantity) <= 0) {
      user.cart.splice(itemIndex, 1);
    } else {
      user.cart[itemIndex].quantity = Number(quantity);
    }

    await user.save();

    res.json({
      success: true,
      message: "Cart updated",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:cartKey/size", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { cartKey } = req.params;
    const { nextSize, includePot, selectedPotOption } = req.body || {};
    if (!nextSize?.id && !nextSize?.label) {
      return res.status(400).json({ message: "Invalid size payload" });
    }

    const currentIndex = user.cart.findIndex((item) => getItemKey(item) === cartKey);
    if (currentIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const currentItem = user.cart[currentIndex].toObject
      ? user.cart[currentIndex].toObject()
      : user.cart[currentIndex];
    const potState = normalizePotSelection(nextSize, includePot, selectedPotOption);
    const nextKey = buildVariantCartKey(
      currentItem,
      nextSize,
      potState.includePot,
      potState.selectedPotOption,
    );

    const updatedItem = {
      ...currentItem,
      cartKey: nextKey,
      selectedSize: nextSize,
      includePot: potState.includePot,
      selectedPotOption: potState.selectedPotOption,
      price: Number(nextSize.price || 0) + potState.potPrice,
      mrp: Number(nextSize.mrp || 0) + potState.potMrp,
    };

    user.cart = mergeOrReplaceCartItem(user.cart, currentIndex, updatedItem, nextKey);
    await user.save();

    res.json({
      success: true,
      message: "Item size updated",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Error updating item size:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:cartKey/pot", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { cartKey } = req.params;
    const { includePot, selectedPotOption } = req.body || {};
    const currentIndex = user.cart.findIndex((item) => getItemKey(item) === cartKey);

    if (currentIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    const currentItem = user.cart[currentIndex].toObject
      ? user.cart[currentIndex].toObject()
      : user.cart[currentIndex];
    const size = currentItem.selectedSize || {};
    const potState = normalizePotSelection(size, includePot, selectedPotOption);
    const nextKey = buildVariantCartKey(
      currentItem,
      size,
      potState.includePot,
      potState.selectedPotOption,
    );

    const updatedItem = {
      ...currentItem,
      cartKey: nextKey,
      includePot: potState.includePot,
      selectedPotOption: potState.selectedPotOption,
      price: Number(size.price || 0) + potState.potPrice,
      mrp: Number(size.mrp || 0) + potState.potMrp,
    };

    user.cart = mergeOrReplaceCartItem(user.cart, currentIndex, updatedItem, nextKey);
    await user.save();

    res.json({
      success: true,
      message: "Item pot selection updated",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Error updating pot selection:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:cartKey", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { cartKey } = req.params;
    user.cart = user.cart.filter((item) => getItemKey(item) !== cartKey);
    await user.save();

    res.json({
      success: true,
      message: "Item removed from cart",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
      cart: user.cart,
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
