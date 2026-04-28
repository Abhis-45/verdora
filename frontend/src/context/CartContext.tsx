/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ProductItem } from "../types/ProductItem";
import { buildCartKey, PlantSizeOption, PotOption } from "@/utils/productOptions";

type CartContextType = {
  cartItems: ProductItem[];
  addToCart: (product: ProductItem) => Promise<void>;
  removeFromCart: (id: number | string) => Promise<void>;
  updateQuantity: (id: number | string, qty: number) => Promise<void>;
  updateItemSize: (id: number | string, size: PlantSizeOption) => Promise<void>;
  updateItemPot: (
    id: number | string,
    includePot: boolean,
    selectedPotOption?: PotOption | null,
  ) => Promise<void>;
  clearCart: () => void;
  syncCartFromBackend: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<ProductItem[]>([]);

  const getItemKey = (item: Partial<ProductItem>) =>
    item.cartKey ||
    (() => {
      const baseKey = buildCartKey(
        item.productId || item.id || "",
        item.selectedSize?.id,
        item.selectedSize?.label,
      );

      if (!item.includePot) {
        return baseKey;
      }

      const potToken = item.selectedPotOption?.name || "default";
      return `${baseKey}::with-pot::${potToken}`;
    })();

  const getBaseVariantKey = (
    productId: string | number,
    size?: PlantSizeOption | null,
  ) => buildCartKey(productId, size?.id, size?.label);

  const resolvePotState = (
    size: PlantSizeOption | null | undefined,
    includePot: boolean,
    selectedPotOption?: PotOption | null,
  ) => {
    const supportsPot = Boolean(size?.potPrice && size.potPrice > 0);
    if (!size || !includePot || !supportsPot) {
      return {
        includePot: false,
        selectedPotOption: null as PotOption | null,
        potPrice: 0,
        potMrp: 0,
      };
    }

    if (selectedPotOption) {
      return {
        includePot: true,
        selectedPotOption,
        potPrice: Number(selectedPotOption.price || 0),
        potMrp: Number(selectedPotOption.mrp || 0),
      };
    }

    const fallbackOption: PotOption = {
      name: String(size.potName || "Default Pot"),
      price: Number(size.potPrice || 0),
      mrp: Number(size.potMrp || 0),
      image: size.potImage || "",
    };

    return {
      includePot: true,
      selectedPotOption: fallbackOption,
      potPrice: Number(fallbackOption.price || 0),
      potMrp: Number(fallbackOption.mrp || 0),
    };
  };

  const getVariantKey = (
    productId: string | number,
    size: PlantSizeOption | null | undefined,
    includePot: boolean,
    selectedPotOption?: PotOption | null,
  ) => {
    const baseKey = getBaseVariantKey(productId, size);
    if (!includePot) {
      return baseKey;
    }
    const potToken = selectedPotOption?.name || "default";
    return `${baseKey}::with-pot::${potToken}`;
  };

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
        await fetch(`${BACKEND_URL}/api/cart/${encodeURIComponent(String(id))}`, {
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
        await fetch(`${BACKEND_URL}/api/cart/${encodeURIComponent(String(id))}`, {
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
    const previousKey = String(id);
    let nextKey = previousKey;
    let includePot = false;
    let selectedPotOption: PotOption | null = null;

    setCartItems((prev) => {
      const currentItem = prev.find(
        (item) => getItemKey(item) === previousKey || item.id === id,
      );

      if (!currentItem) {
        return prev;
      }

      const supportsPot = Boolean(nextSize.potPrice && nextSize.potPrice > 0);
      const keepPotEnabled = Boolean(currentItem.includePot && supportsPot);
      const validPotOption =
        keepPotEnabled &&
        currentItem.selectedPotOption &&
        Array.isArray(nextSize.potOptions) &&
        nextSize.potOptions.some(
          (option) => option.name === currentItem.selectedPotOption?.name,
        )
          ? currentItem.selectedPotOption
          : null;

      const potState = resolvePotState(nextSize, keepPotEnabled, validPotOption);
      includePot = potState.includePot;
      selectedPotOption = potState.selectedPotOption;

      const finalPrice = Number(nextSize.price || 0) + potState.potPrice;
      const finalMrp = Number(nextSize.mrp || 0) + potState.potMrp;
      nextKey = getVariantKey(
        currentItem.productId || currentItem.id || "",
        nextSize,
        includePot,
        selectedPotOption,
      );

      const remainingItems = prev.filter(
        (item) => getItemKey(item) !== previousKey && item.id !== id,
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
          selectedPotOption,
        },
      ];
    });

    // Sync with backend if user is logged in
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        await fetch(`${BACKEND_URL}/api/cart/${encodeURIComponent(previousKey)}/size`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ nextSize, includePot, selectedPotOption }),
        });
      }
    } catch (error) {
      console.error("Failed to sync cart size update with backend:", error);
    }
  };

  const updateItemPot = async (
    id: number | string,
    includePot: boolean,
    selectedPotOption?: PotOption | null,
  ) => {
    const previousKey = String(id);
    let nextKey = previousKey;
    let nextIncludePot = includePot;
    let nextSelectedPotOption: PotOption | null = selectedPotOption || null;

    setCartItems((prev) => {
      const currentItem = prev.find(
        (item) => getItemKey(item) === previousKey || item.id === id,
      );
      if (!currentItem || !currentItem.selectedSize) {
        return prev;
      }

      const size = currentItem.selectedSize;
      const potState = resolvePotState(
        size,
        includePot,
        selectedPotOption ?? currentItem.selectedPotOption ?? null,
      );

      nextIncludePot = potState.includePot;
      nextSelectedPotOption = potState.selectedPotOption;

      const finalPrice = Number(size.price || 0) + potState.potPrice;
      const finalMrp = Number(size.mrp || 0) + potState.potMrp;
      nextKey = getVariantKey(
        currentItem.productId || currentItem.id || "",
        size,
        nextIncludePot,
        nextSelectedPotOption,
      );

      const remainingItems = prev.filter(
        (item) => getItemKey(item) !== previousKey && item.id !== id,
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
          includePot: nextIncludePot,
          selectedPotOption: nextSelectedPotOption,
          price: finalPrice,
          mrp: finalMrp,
        },
      ];
    });

    try {
      const token = localStorage.getItem("token");
      if (token) {
        const BACKEND_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        await fetch(`${BACKEND_URL}/api/cart/${encodeURIComponent(previousKey)}/pot`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            includePot: nextIncludePot,
            selectedPotOption: nextSelectedPotOption,
          }),
        });
      }
    } catch (error) {
      console.error("Failed to sync cart pot update with backend:", error);
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
        updateItemPot,
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
