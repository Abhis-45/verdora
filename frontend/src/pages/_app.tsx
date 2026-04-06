/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AppProps } from "next/app";
import { CartProvider } from "../context/CartContext";
import "../app/globals.css";
import { WishlistProvider } from "../context/WishlistContext";
import { DeliveryLocationProvider } from "@/context/DeliveryLocationContext";
import { UserProvider } from "@/context/UserContext";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { useEffect } from "react";

export default function MyApp({ Component, pageProps }: AppProps) {
  // Clean up default/empty pincodes from sessionStorage on app load
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("delivery-location");
        if (stored) {
          const parsed = JSON.parse(stored);
          // If stored pincode is empty or missing, clear it
          if (!parsed.pincode || !parsed.pincode.trim()) {
            sessionStorage.removeItem("delivery-location");
            console.log("[App] Cleared empty pincode from sessionStorage");
          }
        }
      } catch (error) {
        console.warn("[App] Error checking sessionStorage:", error);
      }
    }
  }, []);

  // Suppress console errors in production
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "production"
    ) {
      // Suppress console errors
      const originalError = console.error;
      console.error = (...args: any[]) => {
        // Only log critical errors
        if (
          args[0] &&
          typeof args[0] === "string" &&
          (args[0].includes("404") || args[0].includes("500"))
        ) {
          originalError(...args);
        }
      };

      // Suppress unhandled promise rejections
      window.addEventListener("unhandledrejection", (event) => {
        event.preventDefault();
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <UserProvider>
        <DeliveryLocationProvider>
          <CartProvider>
            <WishlistProvider>
              <Component {...pageProps} />
            </WishlistProvider>
          </CartProvider>
        </DeliveryLocationProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}
