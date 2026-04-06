/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ProductItem } from "../types/ProductItem";
import { useCart } from "../context/CartContext"; // ✅ import cart context

type WishlistContextType = {
  wishlist: ProductItem[];
  addToWishlist: (product: ProductItem) => void;
  removeFromWishlist: (id: number | string) => void;
  clearWishlist: () => void;
  moveToCart: (product: ProductItem) => void; // ✅ new function
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [wishlist, setWishlist] = useState<ProductItem[]>([]);
  const { addToCart } = useCart(); // ✅ get addToCart from cart context

  // ✅ Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("wishlist");
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  // ✅ Persist to localStorage
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // ✅ Add to wishlist (prevent duplicates by id)
  const addToWishlist = (product: ProductItem) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      return exists ? prev : [...prev, product];
    });
  };

  // ✅ Remove item
  const removeFromWishlist = (id: number | string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  // ✅ Clear wishlist
  const clearWishlist = () => {
    setWishlist([]);
  };

  // ✅ Move to cart
  const moveToCart = (product: ProductItem) => {
    addToCart(product); // add product to cart
    removeFromWishlist(product.id); // remove from wishlist
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        moveToCart,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
