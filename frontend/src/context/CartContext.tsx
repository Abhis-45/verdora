/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ProductItem } from "../types/ProductItem";
import { buildCartKey, PlantSizeOption } from "@/utils/productOptions";

type CartContextType = {
  cartItems: ProductItem[];
  addToCart: (product: ProductItem) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, newQuantity: number) => void;
  updateItemSize: (id: number | string, nextSize: PlantSizeOption) => void;
  clearCart: () => void;
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
  const addToCart = (product: ProductItem) => {
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
  };

  // ✅ Remove product from cart
  const removeFromCart = (id: number | string) => {
    setCartItems((prev) =>
      prev.filter((item) => getItemKey(item) !== String(id) && item.id !== id),
    );
  };

  // ✅ Update product quantity
  const updateQuantity = (id: number | string, newQuantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        getItemKey(item) === String(id) || item.id === id
          ? { ...item, quantity: Math.max(newQuantity, 1) }
          : item,
      ),
    );
  };

  const updateItemSize = (id: number | string, nextSize: PlantSizeOption) => {
    setCartItems((prev) => {
      const currentItem = prev.find(
        (item) => getItemKey(item) === String(id) || item.id === id,
      );

      if (!currentItem) {
        return prev;
      }

      const nextKey = buildCartKey(
        currentItem.productId || currentItem.id || "",
        nextSize.id,
        nextSize.label,
      );

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
          price: nextSize.price,
          mrp: nextSize.mrp,
        },
      ];
    });
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
