import React, { useState, useRef, useEffect, useCallback } from "react";
import { PincodeData } from "@/utils/pincodeApi";
import { getCurrentLocation, reverseGeocode } from "@/utils/geolocation";
import { saveDeliveryLocation } from "@/utils/deliveryDataManager";
import { useDeliveryLocation } from "@/context/DeliveryLocationContext";
import { MapPinIcon } from "@heroicons/react/24/outline";

interface PincodeSuggestionsProps {
  onSelect: (data: PincodeData) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export const PincodeSuggestions: React.FC<PincodeSuggestionsProps> = ({
  onSelect,
  placeholder = "Enter pincode",
  className = "",
  inputClassName = "",
}) => {
  const { updateDeliveryLocation } = useDeliveryLocation();
  const [pincode, setPincode] = useState("");
  const [suggestion, setSuggestion] = useState<PincodeData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    city: string;
    state: string;
    area?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch pincode data directly from API
  const fetchPincodeData = useCallback(
    async (code: string): Promise<PincodeData | null> => {
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${code}`,
          {
            method: "GET",
          },
        );

        if (!response.ok) {
          console.error("API Error:", response.status);
          return null;
        }

        let data = await response.json();
        console.log("API Raw Response:", data);

        // Handle array-wrapped response
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }

        console.log("API Processed Data:", data);

        if (
          data &&
          data.Status === "Success" &&
          data.PostOffice &&
          data.PostOffice.length > 0
        ) {
          const office = data.PostOffice[0];
          const result = {
            pincode: code,
            city: office.District || "Unknown",
            state: office.State || "Unknown",
            area: office.Name || undefined,
            country: "India",
          };
          console.log("✅ Pincode found:", result);
          return result;
        }
        console.warn("❌ Invalid or empty response");
        return null;
      } catch (error) {
        console.error("Fetch error:", error);
        return null;
      }
    },
    [],
  );

  const handleInputChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setPincode(cleaned);

    // Clear existing timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (cleaned.length < 6) {
      setSuggestion(null);
      setIsOpen(false);
      return;
    }

    if (cleaned.length === 6) {
      setLoading(true);
      setIsOpen(true);
      setCurrentLocation(null); // Clear current location hint when user enters pincode

      timeoutRef.current = setTimeout(async () => {
        const data = await fetchPincodeData(cleaned);
        if (data) {
          setSuggestion(data);
          setIsOpen(true);
        } else {
          setSuggestion(null);
          setIsOpen(true);
        }
        setLoading(false);
      }, 600);
    }
  };

  const handleSelectSuggestion = (data: PincodeData) => {
    console.log("[PincodeSuggestions] Selected suggestion:", data);

    // Save to localStorage for persistence (backward compatibility)
    saveDeliveryLocation({
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      area: data.area,
    });

    // Update the global context (CRITICAL for header and all components)
    updateDeliveryLocation({
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      address: data.area || data.city,
    });

    // Call the parent callback
    onSelect(data);

    // Clear local state
    setPincode("");
    setSuggestion(null);
    setCurrentLocation(null);
    setLocationError(null);
    setIsOpen(false);
  };

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    setLocationError(null);
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        setLocationError(
          "📍 Location access denied. Enable location permissions.",
        );
        setGettingLocation(false);
        return;
      }

      // Get reverse geocoded address first
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      if (!address) {
        setLocationError("Could not determine location. Please try again.");
        setGettingLocation(false);
        return;
      }

      // Store current location for display
      setCurrentLocation({
        city: address.city || "Unknown",
        state: address.state || "Unknown",
        area: address.area,
      });

      // Try backend endpoint for pincode lookup from coordinates
      try {
        const response = await fetch(
          `/api/pincode/from-coordinates?lat=${coords.latitude}&lon=${coords.longitude}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // If we got a pincode, use it directly
            if (data.data.pincode) {
              const pincodeData: PincodeData = {
                pincode: data.data.pincode,
                city: data.data.city || address.city || "Unknown",
                state: data.data.state || address.state || "Unknown",
                area: data.data.area || address.area,
                country: "India",
              };
              // Save location data for persistence
              saveDeliveryLocation({
                pincode: data.data.pincode,
                city: data.data.city || address.city || "Unknown",
                state: data.data.state || address.state || "Unknown",
                area: data.data.area || address.area,
              });
              // Update context (CRITICAL for header and components)
              updateDeliveryLocation({
                pincode: data.data.pincode,
                city: data.data.city || address.city || "Unknown",
                state: data.data.state || address.state || "Unknown",
                address:
                  data.data.area ||
                  address.area ||
                  data.data.city ||
                  address.city ||
                  "",
              });
              // Auto-fill pincode input box and close dropdown
              setPincode(data.data.pincode);
              onSelect(pincodeData);
              setSuggestion(null);
              setCurrentLocation(null);
              setLocationError(null);
              setIsOpen(false);
              setGettingLocation(false);
              return;
            }

            // Otherwise, auto-search for pincodes in this city
            // Use common pincodes for major cities as fallback
            const commonCityPincodes: Record<string, string> = {
              Mumbai: "400001",
              Delhi: "110001",
              Bangalore: "560001",
              Hyderabad: "500001",
              Chennai: "600001",
              Kolkata: "700001",
              Pune: "411001",
              Ahmedabad: "380001",
              Jaipur: "302001",
              Lucknow: "226001",
            };

            const cityName = data.data.city || address.city || "";
            const commonPincode = Object.entries(commonCityPincodes).find(
              ([key]) =>
                cityName.toLowerCase().includes(key.toLowerCase()) ||
                key.toLowerCase().includes(cityName.toLowerCase()),
            )?.[1];

            if (commonPincode) {
              // Fetch data for the common pincode
              const pincodeResponse = await fetch(
                `/api/pincode/${commonPincode}`,
              );
              if (pincodeResponse.ok) {
                const pincodeResult = await pincodeResponse.json();
                if (pincodeResult.data) {
                  const pincodeData: PincodeData = {
                    pincode: pincodeResult.data.pincode,
                    city:
                      pincodeResult.data.city || data.data.city || "Unknown",
                    state:
                      pincodeResult.data.state || data.data.state || "Unknown",
                    area: pincodeResult.data.area,
                    country: "India",
                  };
                  // Save location data for persistence
                  saveDeliveryLocation({
                    pincode: pincodeResult.data.pincode,
                    city:
                      pincodeResult.data.city || data.data.city || "Unknown",
                    state:
                      pincodeResult.data.state || data.data.state || "Unknown",
                    area: pincodeResult.data.area,
                  });
                  // Update context (CRITICAL for header and components)
                  updateDeliveryLocation({
                    pincode: pincodeResult.data.pincode,
                    city:
                      pincodeResult.data.city || data.data.city || "Unknown",
                    state:
                      pincodeResult.data.state || data.data.state || "Unknown",
                    address:
                      pincodeResult.data.area ||
                      pincodeResult.data.city ||
                      data.data.city ||
                      "",
                  });
                  // Auto-fill pincode input box with detected pincode
                  setPincode(commonPincode);
                  onSelect(pincodeData);
                  setSuggestion(null);
                  setIsOpen(false);
                  setLocationError(null);
                  setGettingLocation(false);
                  return;
                }
              }
            }
          }
        }
      } catch {
        console.log("Backend pincode lookup failed");
      }

      // Show location and ask user to enter pincode
      setLocationError(
        `📍 Location: ${address.city}, ${address.state}. Enter 6-digit pincode to confirm.`,
      );
      setIsOpen(true);
      setGettingLocation(false);
    } catch (error) {
      setLocationError("Failed to get location. Please try manual entry.");
      console.error("Location error:", error);
      setGettingLocation(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            value={pincode}
            onChange={(e) => handleInputChange(e.target.value)}
            maxLength={6}
            autoComplete="off"
            className={`w-full px-4 py-3 text-base font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all ${inputClassName}`}
          />

          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-200" />
            </div>
          )}

          {pincode.length > 0 && pincode.length < 6 && !loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
              {6 - pincode.length}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={gettingLocation || loading}
          className="px-4 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          {gettingLocation ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline text-sm">Getting...</span>
            </>
          ) : (
            <>
              <MapPinIcon className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Current</span>
            </>
          )}
        </button>
      </div>

      {locationError && (
        <p className="text-xs text-amber-600 mt-2 font-semibold">
          ℹ️ {locationError}
        </p>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50">
          {loading ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500 font-semibold">
                Searching pincode...
              </p>
            </div>
          ) : suggestion ? (
            <button
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-4 text-left hover:bg-green-50 active:bg-green-100 transition-colors border-b-2 border-gray-100 last:border-0"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    ✓ Suggestion
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {suggestion.city}
                  </p>
                  <p className="text-base font-semibold text-gray-700">
                    {suggestion.state}
                  </p>
                  {suggestion.area && (
                    <p className="text-sm text-gray-600 mt-2">
                      Area: {suggestion.area}
                    </p>
                  )}
                </div>
                <div className="text-2xl">✓</div>
              </div>
            </button>
          ) : currentLocation && !loading ? (
            <div className="p-4 text-center border-b-2 border-blue-100 bg-blue-50">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                📍 Current Location Found
              </p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {currentLocation.city}
              </p>
              <p className="text-base font-semibold text-gray-700">
                {currentLocation.state}
              </p>
              {currentLocation.area && (
                <p className="text-sm text-gray-600 mt-2">
                  Area: {currentLocation.area}
                </p>
              )}
              <p className="text-xs text-blue-600 mt-3 font-semibold">
                ↑ Enter your 6-digit pincode above ↑
              </p>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-red-600 font-bold">
                ❌ Pincode Not Found
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Please check and try again
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
