import { useState, useCallback } from "react";
import { fetchLocationFromPincode, normalizePincode } from "@/utils/pincodeApi";
import { getCurrentLocationWithAddress } from "@/utils/geolocation";

export type AddressData = {
  label?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
};

export type UseAddressInputReturn = {
  address: AddressData;
  updateAddress: (updates: Partial<AddressData>) => void;
  updatePincodeAndFetch: (pincode: string) => Promise<void>;
  getCurrentLocationAddress: () => Promise<void>;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
};

/**
 * Custom hook for managing address input with pincode API integration
 */
export const useAddressInput = (
  initialAddress?: Partial<AddressData>,
): UseAddressInputReturn => {
  const [address, setAddress] = useState<AddressData>({
    label: initialAddress?.label || "",
    address: initialAddress?.address || "",
    city: initialAddress?.city || "",
    state: initialAddress?.state || "",
    pincode: initialAddress?.pincode || "",
    country: initialAddress?.country || "India",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAddress = useCallback((updates: Partial<AddressData>) => {
    setAddress((prev) => ({
      ...prev,
      ...updates,
    }));
    setError(null);
  }, []);

  const updatePincodeAndFetch = useCallback(
    async (newPincode: string) => {
      try {
        setLoading(true);
        setError(null);

        const normalized = normalizePincode(newPincode);
        if (!normalized) {
          setError("Invalid pincode format");
          setLoading(false);
          return;
        }

        updateAddress({ pincode: normalized });

        const data = await fetchLocationFromPincode(normalized);
        if (data) {
          updateAddress({
            pincode: data.pincode,
            city: data.city,
            state: data.state,
            address: data.area || address.address || data.city,
            country: "India",
          });
        } else {
          setError("Pincode not found. Please enter manually.");
        }
      } catch (err) {
        setError("Error fetching location data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [address.address, updateAddress],
  );

  const getCurrentLocationAddress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getCurrentLocationWithAddress();
      if (result) {
        const { address: locationAddress } = result;
        updateAddress({
          city: locationAddress.city || "Current location",
          state: locationAddress.state || "",
          address: locationAddress.area || "",
          country: locationAddress.country || "India",
        });
      } else {
        setError(
          "Unable to get your location. Please enable location services.",
        );
      }
    } catch (err) {
      setError("Error getting current location");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [updateAddress]);

  return {
    address,
    updateAddress,
    updatePincodeAndFetch,
    getCurrentLocationAddress,
    loading,
    error,
    setError,
  };
};
