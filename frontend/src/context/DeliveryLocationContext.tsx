/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  DEFAULT_DELIVERY_LOCATION,
  DeliveryLocation,
  normalizePincode,
  resolveDeliveryLocation,
} from "@/utils/delivery";

type DeliveryLocationContextType = {
  deliveryLocation: DeliveryLocation;
  updateDeliveryLocation: (location: Partial<DeliveryLocation>) => void;
  updateDeliveryPincode: (pincode: string) => void;
  resetDeliveryLocation: () => void;
};

type ProfileAddress = {
  label?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isDefault?: boolean;
};

const STORAGE_KEY = "delivery-location";

const DeliveryLocationContext =
  createContext<DeliveryLocationContextType | null>(null);

export function DeliveryLocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [isHydrated, setIsHydrated] = useState(false);

  // Start with default location on server and client (prevents hydration mismatch)
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>(
    DEFAULT_DELIVERY_LOCATION,
  );

  // Load from sessionStorage ONLY on client after hydration
  // Only load if user has explicitly entered a pincode (not default)
  // sessionStorage clears when browser closes
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only restore if it's a user-entered pincode (not default empty)
        if (parsed.pincode && parsed.pincode.trim()) {
          setDeliveryLocation(resolveDeliveryLocation(parsed));
          console.log(
            "[DeliveryLocationContext] Loaded user-entered location from sessionStorage:",
            parsed,
          );
        } else {
          console.log(
            "[DeliveryLocationContext] Stored location is empty, using default",
          );
          setDeliveryLocation(DEFAULT_DELIVERY_LOCATION);
        }
      } else {
        console.log(
          "[DeliveryLocationContext] No stored location, using default",
        );
        setDeliveryLocation(DEFAULT_DELIVERY_LOCATION);
      }
    } catch (error) {
      console.error(
        "[DeliveryLocationContext] Error loading from storage:",
        error,
      );
      setDeliveryLocation(DEFAULT_DELIVERY_LOCATION);
    }
    setIsHydrated(true);
  }, []);

  // Save to sessionStorage ONLY when user enters a real pincode (not default)
  // sessionStorage clears automatically when browser closes
  useEffect(() => {
    if (
      isHydrated &&
      deliveryLocation.pincode &&
      deliveryLocation.pincode.trim()
    ) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(deliveryLocation));
        console.log(
          "[DeliveryLocationContext] Saved user-entered location to sessionStorage:",
          deliveryLocation,
        );
      } catch (error) {
        console.error(
          "[DeliveryLocationContext] Error saving to sessionStorage:",
          error,
        );
      }
    } else if (
      isHydrated &&
      (!deliveryLocation.pincode || !deliveryLocation.pincode.trim())
    ) {
      // If pincode is empty, clear from sessionStorage (user reset it)
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        console.log(
          "[DeliveryLocationContext] Cleared empty location from sessionStorage",
        );
      } catch (error) {
        console.error(
          "[DeliveryLocationContext] Error clearing sessionStorage:",
          error,
        );
      }
    }
  }, [deliveryLocation, isHydrated]);

  useEffect(() => {
    // Only sync from profile if user is logged in
    if (!user) {
      console.log(
        "[DeliveryLocationContext] No authenticated user, keeping saved location",
      );
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    let isCancelled = false;

    const syncDefaultAddress = async () => {
      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const response = await fetch(`${BACKEND_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.warn(
            "[DeliveryLocationContext] Profile fetch failed:",
            response.status,
          );
          return;
        }

        const profile = await response.json();
        const addresses = Array.isArray(profile?.addresses)
          ? (profile.addresses as ProfileAddress[])
          : [];
        const defaultAddress =
          addresses.find((entry) => entry.isDefault) || addresses[0];

        if (!defaultAddress || isCancelled) return;

        console.log(
          "[DeliveryLocationContext] Syncing profile default address:",
          defaultAddress,
        );
        setDeliveryLocation(
          resolveDeliveryLocation({
            label: defaultAddress.label,
            address: defaultAddress.address,
            city: defaultAddress.city,
            state: defaultAddress.state,
            pincode: defaultAddress.pincode,
            country: "India",
          }),
        );
      } catch (error) {
        console.error(
          "[DeliveryLocationContext] Error syncing default address:",
          error,
        );
        // Keep the current or default delivery location when profile sync fails.
      }
    };

    syncDefaultAddress();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const value = useMemo<DeliveryLocationContextType>(
    () => ({
      deliveryLocation,
      updateDeliveryLocation: (location) => {
        setDeliveryLocation((current) =>
          resolveDeliveryLocation({
            ...current,
            ...location,
          }),
        );
      },
      updateDeliveryPincode: (pincode) => {
        const normalizedPincode = normalizePincode(pincode);
        setDeliveryLocation((current) => {
          if (!normalizedPincode) {
            return current;
          }

          return resolveDeliveryLocation({
            ...current,
            pincode: normalizedPincode,
            address: current.address,
            city: current.city,
            state: current.state,
          });
        });
      },
      resetDeliveryLocation: () =>
        setDeliveryLocation(DEFAULT_DELIVERY_LOCATION),
    }),
    [deliveryLocation],
  );

  return (
    <DeliveryLocationContext.Provider value={value}>
      {children}
    </DeliveryLocationContext.Provider>
  );
}

export const useDeliveryLocation = () => {
  const context = useContext(DeliveryLocationContext);
  if (!context) {
    throw new Error(
      "useDeliveryLocation must be used within DeliveryLocationProvider",
    );
  }

  return context;
};
