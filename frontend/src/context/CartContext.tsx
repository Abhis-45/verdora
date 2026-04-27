/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ProductItem } from "../types/ProductItem";
import { buildCartKey, PlantSizeOption } from "@/utils/productOptions";

type CartContextType = {
  cartItems: ProductItem[];
  addToCart: (product: ProductItem) => Promise<void>;
  removeFromCart: (id: number | string) => Promise<void>;
  updateQuantity: (id: number | string, qty: number) => Promise<void>;
  updateItemSize: (id: number | string, size: PlantSizeOption) => Promise<void>;
  clearCart: () => void;
  syncCartFromBackend: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<ProductItem[]>([]);

  const getItemKey = (item: Partial<ProductItem>) =>
    item.cartKey ||
    buildCartKey(
      item.productId || item.id || "",
      item.selectedSize?.id,
      item.selectedSize?.label,
    );

  // ✅ Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setCartItems(JSON.parse(saved));
  }, []);

  // ✅ Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ Add product to cart
  const addToCart = async (product: ProductItem) => {
    setCartItems((prev) => {
      const productKey = getItemKey(product);
      const existing = prev.find((item) => getItemKey(item) === productKey);
      if (existing) {
        return prev.map((item) =>
          getItemKey(item) === productKey
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item,
        );
      }
      return [
        ...prev,
        {
          ...product,
          cartKey: productKey,
          quantity: product.quantity || 1,
        },
      ];
    });

    // Sync with backend if user is logged in
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        await fetch(`${BACKEND_URL}/api/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(product),
        });
      }
    } catch (error) {
      console.error("Failed to sync cart with backend:", error);
    }
  };

  // ✅ Remove product from cart
  const removeFromCart = async (id: number | string) => {
    setCartItems((prev) =>
      prev.filter((item) => getItemKey(item) !== String(id) && item.id !== id),
    );

    // Sync with backend if user is logged in
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        await fetch(`${BACKEND_URL}/api/cart/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Failed to sync cart removal with backend:", error);
    }
  };

  // ✅ Update product quantity
  const updateQuantity = async (id: number | string, newQuantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        getItemKey(item) === String(id) || item.id === id
          ? { ...item, quantity: Math.max(newQuantity, 1) }
          : item,
      ),
    );

    // Sync with backend if user is logged in
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        await fetch(`${BACKEND_URL}/api/cart/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: newQuantity }),
        });
      }
    } catch (error) {
      console.error("Failed to sync cart quantity with backend:", error);
    }
  };

  const updateItemSize = async (id: number | string, nextSize: PlantSizeOption) => {
    let nextKey: string = "";
    let includePot: boolean = false;

    setCartItems((prev) => {
      const currentItem = prev.find(
        (item) => getItemKey(item) === String(id) || item.id === id,
      );

      if (!currentItem) {
        return prev;
      }

      // If the item has pot selected but the new size doesn't support pot, disable pot
      includePot = currentItem.includePot && nextSize.potPrice && nextSize.potPrice > 0 ? currentItem.includePot : false;

      // Calculate final price including pot if applicable
      const finalPrice = includePot && nextSize.potPrice
        ? nextSize.price + nextSize.potPrice
        : nextSize.price;
      const finalMrp = includePot && nextSize.potMrp
        ? nextSize.mrp + (nextSize.potMrp || 0)
        : nextSize.mrp;

      nextKey = includePot
        ? buildCartKey(currentItem.productId || currentItem.id || "", nextSize.id, nextSize.label) + "::with-pot"
        : buildCartKey(currentItem.productId || currentItem.id || "", nextSize.id, nextSize.label);

      const remainingItems = prev.filter(
        (item) => getItemKey(item) !== String(id) && item.id !== id,
      );
      const existingVariant = remainingItems.find(
        (item) => getItemKey(item) === nextKey,
      );

      if (existingVariant) {
        return remainingItems.map((item) =>
          getItemKey(item) === nextKey
            ? { ...item, quantity: item.quantity + currentItem.quantity }
            : item,
        );
      }

      return [
        ...remainingItems,
        {
          ...currentItem,
          cartKey: nextKey,
          selectedSize: nextSize,
          price: finalPrice,
          mrp: finalMrp,
          includePot,
        },
      ];
    });

    // Sync with backend if user is logged in
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        await fetch(`${BACKEND_URL}/api/cart/${nextKey}/size`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ nextSize, includePot }),
        });
      }
    } catch (error) {
      console.error("Failed to sync cart size update with backend:", error);
    }
  };

  // ✅ Sync cart from backend
  const syncCartFromBackend = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const response = await fetch(`${BACKEND_URL}/api/cart`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.cart) {
            setCartItems(data.cart);
          }
        }
      }
    } catch (error) {
      console.error("Failed to sync cart from backend:", error);
    }
  };

  // ✅ Clear cart
  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemSize,
        clearCart,
        syncCartFromBackend,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
