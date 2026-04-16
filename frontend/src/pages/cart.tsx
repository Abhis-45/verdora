/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCart } from "../context/CartContext";
import Layout from "../components/common/layout";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useUser } from "../context/UserContext";
import AuthPopup from "@/components/auth/AuthPop";
import Spinner from "@/components/shared/Spinner";
import Toast from "../components/shared/Toast";
import CartItemsList from "../components/cart/CartItemsList";
import CartSummary from "../components/cart/CartSummary";
import {
  calculateDeliveryEstimate,
  formatDeliveryDate,
} from "@/utils/delivery";
import { getLastDeliveryLocation } from "@/utils/deliveryDataManager";

export default function CartPage() {
  const router = useRouter();
  const {
    cartItems,
    updateQuantity,
    updateItemSize,
    removeFromCart,
    clearCart,
  } = useCart();
  const { user } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [autoRedirectTimer, setAutoRedirectTimer] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoRedirectTimer) {
        clearTimeout(autoRedirectTimer);
      }
    };
  }, [autoRedirectTimer]);

  const couponRules: Record<
    string,
    { type: "percent" | "flat"; value: number }
  > = {
    VERDORA10: { type: "percent", value: 10 },
    SAVE50: { type: "flat", value: 50 },
  };

  // Calculate subtotal using MRP (original price) - if MRP is not set, fallback to price
  // This ensures we always have a baseline for discount calculation
  const subtotal = cartItems.reduce((acc, item) => {
    const itemMrp = item.mrp && item.mrp > item.price ? item.mrp : item.price;
    return acc + itemMrp * item.quantity;
  }, 0);

  // Calculate the total after item-level discounts (actual selling price)
  const discountedTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  let couponDiscount = 0;
  if (appliedCoupon && couponRules[appliedCoupon]) {
    const rule = couponRules[appliedCoupon];
    couponDiscount =
      rule.type === "percent"
        ? (discountedTotal * rule.value) / 100
        : rule.value;
  }

  // Product discount = difference between original price (MRP) and selling price
  const productDiscount = subtotal - discountedTotal;
  const totalDiscount = productDiscount + couponDiscount;
  const finalAmount = Math.max(discountedTotal - couponDiscount, 0);

  // Debug logging to check discount calculations
  useEffect(() => {
    if (cartItems.length > 0) {
      console.log("=== Cart Discount Debug ===");
      console.log("Total Items in Cart:", cartItems.length);
      console.log("Subtotal (with MRP):", subtotal.toFixed(2));
      console.log(
        "Discounted Total (selling price):",
        discountedTotal.toFixed(2),
      );
      console.log("Product Discount:", productDiscount.toFixed(2));
      console.log("Coupon Discount:", couponDiscount.toFixed(2));
      console.log("Total Discount:", totalDiscount.toFixed(2));
      console.log("Final Amount:", finalAmount.toFixed(2));
      cartItems.forEach((item, idx) => {
        const itemMrp =
          item.mrp && item.mrp > item.price ? item.mrp : item.price;
        const itemDiscount = (itemMrp - item.price) * item.quantity;
        console.log(`Item ${idx + 1}: ${item.name}`, {
          price: item.price,
          mrp: item.mrp,
          effectiveMrp: itemMrp,
          quantity: item.quantity,
          itemDiscount: itemDiscount.toFixed(2),
        });
      });
    }
  }, [cartItems, appliedCoupon]);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const timeoutMs = 10000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
    );

    const BACKEND_URL =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
        : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

    Promise.race([
      fetch(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      timeoutPromise,
    ])
      .then((response) => {
        const typedResponse = response as Response;
        if (!typedResponse.ok) throw new Error("Failed to fetch profile");
        return typedResponse.json();
      })
      .then((data) => setProfile(data))
      .catch((error) => {
        console.error("Profile fetch error:", error);
        setProfile(null);
      });
  }, [user]);

  const defaultAddress = useMemo(() => {
    // First try to get from profile
    const profileAddress =
      profile?.addresses?.find((address: any) => address.isDefault) ||
      profile?.addresses?.[0];

    if (profileAddress) return profileAddress;

    // Fallback to localStorage delivery location
    const savedLocation = getLastDeliveryLocation();
    if (savedLocation) {
      return {
        address: `${savedLocation.city}, ${savedLocation.state} ${savedLocation.pincode}`,
        city: savedLocation.city,
        state: savedLocation.state,
        pincode: savedLocation.pincode,
        area: savedLocation.area,
        _id: `temp_${savedLocation.pincode}`,
      };
    }

    return null;
  }, [profile]);

  const cartItemsWithEstimate = useMemo(() => {
    if (!defaultAddress) return cartItems;

    return cartItems.map((item) => ({
      ...item,
      deliveryEstimate: calculateDeliveryEstimate({
        origin: item.originAddress,
        destination: defaultAddress,
      }),
    }));
  }, [cartItems, defaultAddress]);

  const estimatedDeliveryText = useMemo(() => {
    const dates = cartItemsWithEstimate
      .map((item) => item.deliveryEstimate?.estimatedDeliveryDate)
      .filter(Boolean) as string[];

    if (!dates.length) return null;

    const latest = dates.reduce((max, current) =>
      new Date(current) > new Date(max) ? current : max,
    );

    return formatDeliveryDate(latest);
  }, [cartItemsWithEstimate]);

  const handleApplyCoupon = (event: React.FormEvent) => {
    event.preventDefault();
    if (!coupon) {
      setFeedback("Please enter a coupon code");
      return;
    }

    if (couponRules[coupon]) {
      setAppliedCoupon(coupon);
      setFeedback(`Coupon "${coupon}" applied successfully!`);
    } else {
      setAppliedCoupon(null);
      setFeedback("Invalid coupon code");
    }
    setCoupon("");
  };

  const handleCheckout = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setShowAuth(true);
      return;
    }

    if (!profile) {
      setFeedback("Loading profile... Please wait");
      return;
    }

    if (!profile.name?.trim()) {
      setFeedback(
        "Please add your Full Name in your profile before placing an order",
      );
      return;
    }

    if (!profile.email?.trim()) {
      setFeedback(
        "Please add your Email address in your profile before placing an order",
      );
      return;
    }

    if (!profile.mobile?.trim()) {
      setFeedback(
        "Please add your Mobile number in your profile before placing an order",
      );
      return;
    }

    if (!defaultAddress?._id) {
      setFeedback(
        "Please set a default delivery address in your profile before placing an order",
      );
      return;
    }

    const items = cartItemsWithEstimate.map((item) => ({
      id: item.productId || item.id,
      title: item.name,
      image: item.image,
      price: item.price,
      mrp: item.mrp,
      quantity: item.quantity,
      selectedSize: item.selectedSize,
      originAddress: item.originAddress,
    }));

    setSavingOrder(true);
    setFeedback(null);

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/profile/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          total: finalAmount,
          discount: totalDiscount,
          addressId: defaultAddress._id,
          couponCode: appliedCoupon,
          paymentMethod: "POD",
        }),
      });

      const data = await response.json();
      setSavingOrder(false);

      if (response.ok) {
        setShowThankYou(true);
        setToast({
          message: data.message || "Order placed successfully",
          type: "success",
        });
        clearCart();

        // Set auto-redirect timer for 5 seconds
        const timer = setTimeout(() => {
          setShowThankYou(false);
          router.push("/orders");
        }, 5000);
        setAutoRedirectTimer(timer);
      } else {
        console.error("Order error response:", {
          status: response.status,
          message: data.message,
          error: data.error,
          details: data.details,
        });
        setFeedback(
          data.message ||
            data.error ||
            "Failed to place order. Please try again.",
        );
      }
    } catch (error) {
      setSavingOrder(false);
      console.error("Checkout error:", error);
      setFeedback("Unable to place order right now. Please try again.");
    }
  };

  return (
    <>
      <Head>
        <title>Cart | Verdora</title>
      </Head>
      <Layout>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 font-semibold text-green-600 transition hover:text-green-700"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-green-900 sm:mb-10 sm:text-3xl lg:text-4xl">
            Cart
          </h1>

          {feedback && (
            <div className="mx-auto mb-6 max-w-md text-center">
              <div className="inline-block rounded border border-yellow-200 bg-yellow-50 px-4 py-2 text-yellow-800">
                {feedback}
              </div>
            </div>
          )}

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type === "error" ? "error" : toast.type}
              onClose={() => setToast(null)}
            />
          )}

          {cartItems.length > 0 ? (
            <div className="mb-6 mx-auto max-w-3xl text-sm text-gray-700 lg:block">
              <span className="text-[11px] font-medium text-emerald-700 sm:text-xs">
                You save ₹{totalDiscount.toFixed(2)}
              </span>
              {defaultAddress ? (
                <div className="flex items-center justify-between rounded bg-white p-3 shadow">
                  <div>
                    <div className="font-medium">Deliver to</div>
                    <div className="text-xs text-gray-600">
                      {defaultAddress.address}, {defaultAddress.city},{" "}
                      {defaultAddress.state} {defaultAddress.pincode}
                    </div>
                    <div className="mt-1 text-xs text-blue-700">
                      Estimated delivery by {estimatedDeliveryText || "TBD"}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/profile")}
                    className="text-green-600 underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  No default address.{" "}
                  <button
                    onClick={() => router.push("/profile")}
                    className="text-green-600 underline"
                  >
                    Add address
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
              <div className="space-y-8 lg:col-span-2">
                <CartItemsList
                  cartItems={cartItemsWithEstimate}
                  onUpdate={updateQuantity}
                  onChangeSize={updateItemSize}
                  onRemove={removeFromCart}
                  onClear={clearCart}
                />
              </div>

              <div>
                <CartSummary
                  cartItems={cartItemsWithEstimate}
                  coupon={coupon}
                  setCoupon={setCoupon}
                  feedback={feedback}
                  handleApplyCoupon={handleApplyCoupon}
                  couponDiscount={couponDiscount}
                  totalDiscount={totalDiscount}
                  finalAmount={finalAmount}
                  estimatedDeliveryText={estimatedDeliveryText}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
          ) : (
            <div className="mt-12 text-center sm:mt-20">
              <h2 className="text-xl font-semibold text-gray-700 sm:text-2xl">
                Your cart is empty
              </h2>
              <p className="mt-2 text-sm text-gray-500 sm:text-base">
                Browse products and add them to your cart.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block rounded-lg bg-green-600 px-6 py-2 text-sm text-white shadow transition hover:bg-green-700 sm:py-3 sm:text-base"
              >
                View All Products
              </Link>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center gap-3 border-t border-green-200 bg-white p-3 shadow-lg lg:hidden sm:flex-row sm:justify-between sm:p-4">
            <div className="flex flex-1 flex-col">
              <span className="text-xs font-semibold text-green-800 sm:text-sm">
                Total: ₹{finalAmount.toFixed(2)}
              </span>
              {defaultAddress ? (
                <div className="text-xs text-gray-700">
                  Ship to: {defaultAddress.address}
                  {estimatedDeliveryText
                    ? ` • By ${estimatedDeliveryText}`
                    : ""}
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  No default address.{" "}
                  <button
                    onClick={() => router.push("/profile")}
                    className="text-green-600 underline"
                  >
                    Add address
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleCheckout}
              disabled={savingOrder}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow transition hover:bg-green-700 sm:w-auto sm:text-base"
            >
              {savingOrder ? <Spinner /> : "Checkout"}
            </button>
          </div>
        )}

        {showAuth && (
          <AuthPopup
            onClose={() => setShowAuth(false)}
            onLogin={() => {
              setShowAuth(false);
              handleCheckout();
            }}
          />
        )}

        {showThankYou && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in-95">
              <div className="text-6xl animate-bounce">🎉</div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 ring-2 ring-green-200">
                <span className="text-2xl">💰</span>
                <div className="text-left">
                  <div className="text-xs font-medium text-gray-600">
                    You Saved
                  </div>
                  <div className="text-xl font-bold text-green-700">
                    ₹ {totalDiscount.toFixed(2)}
                  </div>
                </div>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-green-900">
                Thank you for your order! ✓
              </h3>
              <p className="mt-2 text-gray-800">
                Your order has been confirmed
                {estimatedDeliveryText
                  ? ` and will arrive by ${estimatedDeliveryText}.`
                  : "."}
              </p>
              <p className="mt-3 text-sm text-gray-600">
                You will be redirected to your orders in a moment...
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => {
                    if (autoRedirectTimer) clearTimeout(autoRedirectTimer);
                    setShowThankYou(false);
                    router.push("/orders");
                  }}
                  className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition hover:bg-green-700"
                >
                  View Orders
                </button>
                <button
                  onClick={() => {
                    if (autoRedirectTimer) clearTimeout(autoRedirectTimer);
                    setShowThankYou(false);
                    router.push("/");
                  }}
                  className="rounded-lg bg-gray-200 px-6 py-2 font-semibold text-gray-800 transition hover:bg-gray-300"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
