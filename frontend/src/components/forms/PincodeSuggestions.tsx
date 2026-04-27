import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircleIcon,
  MapPinIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  fetchLocationFromPincode,
  normalizePincode,
  PincodeData,
} from "@/utils/pincodeApi";
import { getCurrentLocationWithAddress } from "@/utils/geolocation";
import { saveDeliveryLocation } from "@/utils/deliveryDataManager";
import { useDeliveryLocation } from "@/context/DeliveryLocationContext";

interface PincodeSuggestionsProps {
  onSelect: (data: PincodeData) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  autoSelectOnValid?: boolean;
  showCurrentLocation?: boolean;
}

export const PincodeSuggestions: React.FC<PincodeSuggestionsProps> = ({
  onSelect,
  placeholder = "Enter pincode",
  className = "",
  inputClassName = "",
  value,
  onValueChange,
  autoSelectOnValid = true,
  showCurrentLocation = true,
}) => {
  const { deliveryLocation, updateDeliveryLocation } = useDeliveryLocation();
  const [pincode, setPincode] = useState(() =>
    normalizePincode(value || deliveryLocation.pincode || ""),
  );
  const [suggestion, setSuggestion] = useState<PincodeData | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<{
    city?: string;
    state?: string;
    area?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "warning" | "error">(
    "warning",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setInputValue = useCallback(
    (nextValue: string) => {
      const normalized = normalizePincode(nextValue);
      setPincode(normalized);
      onValueChange?.(normalized);
    },
    [onValueChange],
  );

  useEffect(() => {
    if (value !== undefined) {
      setPincode(normalizePincode(value));
    }
  }, [value]);

  useEffect(() => {
    if (value === undefined && deliveryLocation.pincode && !pincode) {
      setPincode(normalizePincode(deliveryLocation.pincode));
    }
  }, [deliveryLocation.pincode, pincode, value]);

  const commitLocation = useCallback(
    (data: PincodeData, statusMessage = "Location selected") => {
      saveDeliveryLocation({
        pincode: data.pincode,
        city: data.city,
        state: data.state,
        area: data.area,
      });

      updateDeliveryLocation({
        pincode: data.pincode,
        city: data.city,
        state: data.state,
        country: data.country || "India",
        address: data.area || data.city,
      });

      setInputValue(data.pincode);
      setSuggestion(null);
      setDetectedLocation(null);
      setIsOpen(false);
      setMessage(statusMessage);
      setMessageTone("success");
      onSelect(data);
    },
    [onSelect, setInputValue, updateDeliveryLocation],
  );

  const lookupPincode = useCallback(
    async (code: string) => {
      setLoading(true);
      setMessage(null);
      setSuggestion(null);
      setDetectedLocation(null);

      const data = await fetchLocationFromPincode(code);

      if (data) {
        if (autoSelectOnValid) {
          commitLocation(data, `${data.city}, ${data.state} selected`);
        } else {
          setSuggestion(data);
          setIsOpen(true);
        }
      } else {
        setMessage("Pincode not found. Please check and try again.");
        setMessageTone("error");
        setIsOpen(true);
      }

      setLoading(false);
    },
    [autoSelectOnValid, commitLocation],
  );

  const handleInputChange = (nextValue: string) => {
    const cleaned = normalizePincode(nextValue);
    setInputValue(cleaned);
    setMessage(null);
    setSuggestion(null);
    setDetectedLocation(null);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (cleaned.length < 6) {
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setIsOpen(true);
    timeoutRef.current = setTimeout(() => {
      lookupPincode(cleaned);
    }, 450);
  };

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    setMessage(null);
    setSuggestion(null);
    setDetectedLocation(null);

    try {
      const result = await getCurrentLocationWithAddress();

      if (!result) {
        setMessage("Location access failed. Enable permission or enter pincode.");
        setMessageTone("error");
        setIsOpen(false);
        return;
      }

      const { address } = result;
      setDetectedLocation({
        city: address.city,
        state: address.state,
        area: address.area,
      });

      if (!address.pincode) {
        setMessage(
          address.city || address.state
            ? `Detected ${[address.city, address.state].filter(Boolean).join(", ")}. Enter pincode to confirm.`
            : "Location detected. Enter pincode to confirm the delivery area.",
        );
        setMessageTone("warning");
        setIsOpen(true);
        return;
      }

      const pincodeData =
        (await fetchLocationFromPincode(address.pincode)) || {
          pincode: address.pincode,
          city: address.city || "Selected area",
          state: address.state || "India",
          area: address.area,
          country: address.country || "India",
        };

      commitLocation(
        pincodeData,
        `Current location selected: ${pincodeData.pincode}`,
      );
    } catch (error) {
      console.error("Location error:", error);
      setMessage("Failed to get location. Please try manual entry.");
      setMessageTone("error");
    } finally {
      setGettingLocation(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const helperColor =
    messageTone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : messageTone === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            value={pincode}
            onChange={(event) => handleInputChange(event.target.value)}
            maxLength={6}
            autoComplete="postal-code"
            className={`h-12 w-full rounded-xl border border-emerald-200 bg-white px-4 pr-12 text-sm font-semibold text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100 ${inputClassName}`}
            disabled={loading || gettingLocation}
          />

          <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center">
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            ) : pincode.length === 6 && !message ? (
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
            ) : pincode.length > 0 ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                {6 - pincode.length}
              </span>
            ) : null}
          </div>
        </div>

        {showCurrentLocation && (
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={gettingLocation || loading}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:px-4"
            title="Use current location"
          >
            {gettingLocation ? (
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <MapPinIcon className="h-5 w-5" />
            )}
            <span className="hidden sm:inline">
              {gettingLocation ? "Locating" : "Current"}
            </span>
          </button>
        )}
      </div>

      {message && (
        <div
          className={`mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${helperColor}`}
        >
          {messageTone === "error" ? (
            <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      {isOpen && (suggestion || detectedLocation || loading || messageTone === "error") && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-xl">
          {loading ? (
            <div className="p-4 text-center text-sm font-semibold text-gray-500">
              Checking delivery area...
            </div>
          ) : suggestion ? (
            <button
              type="button"
              onClick={() => commitLocation(suggestion)}
              className="w-full px-4 py-4 text-left transition hover:bg-emerald-50"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                Select location
              </p>
              <p className="mt-1 text-sm font-bold text-gray-950">
                {suggestion.city}, {suggestion.state}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {suggestion.area ? `${suggestion.area} - ` : ""}
                {suggestion.pincode}
              </p>
            </button>
          ) : detectedLocation ? (
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                Current location found
              </p>
              <p className="mt-1 text-sm font-bold text-gray-950">
                {[detectedLocation.city, detectedLocation.state]
                  .filter(Boolean)
                  .join(", ") || "Nearby area"}
              </p>
              {detectedLocation.area && (
                <p className="mt-1 text-xs text-gray-500">
                  {detectedLocation.area}
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
