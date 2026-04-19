/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { PlantSizeOption } from "@/utils/productOptions";

export type ViewedProduct = {
  _id?: string;
  id?: string;
  name: string;
  image?: string;
  price: number;
  mrp: number;
  category?: string;
  vendorName?: string;
  plantSizes?: PlantSizeOption[];
};

type RecentlyViewedContextType = {
  viewedProducts: ViewedProduct[];
  addViewedProduct: (product: ViewedProduct) => void;
  clearViewed: () => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextType | null>(
  null
);

export const RecentlyViewedProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [viewedProducts, setViewedProducts] = useState<ViewedProduct[]>([]);

  // ✅ Load viewed products from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentlyViewed");
    if (saved) {
      try {
        setViewedProducts(JSON.parse(saved));
      } catch {
        setViewedProducts([]);
      }
    }
  }, []);

  // ✅ Persist viewed products to localStorage
  useEffect(() => {
    localStorage.setItem("recentlyViewed", JSON.stringify(viewedProducts));
  }, [viewedProducts]);

  // ✅ Add product to viewed list (keep most recent 10)
  const addViewedProduct = (product: ViewedProduct) => {
    setViewedProducts((prev) => {
      const productId = String(product._id || product.id);
      // Remove if already exists
      const filtered = prev.filter(
        (p) => String(p._id || p.id) !== productId
      );
      // Add to front and keep only latest 10
      return [product, ...filtered].slice(0, 10);
    });
  };

  // ✅ Clear viewed products
  const clearViewed = () => {
    setViewedProducts([]);
  };

  return (
    <RecentlyViewedContext.Provider
      value={{ viewedProducts, addViewedProduct, clearViewed }}
    >
      {children}
    </RecentlyViewedContext.Provider>
  );
};

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error(
      "useRecentlyViewed must be used within RecentlyViewedProvider"
    );
  }
  return context;
};
