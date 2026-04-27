"use client";

import React from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useAddressInput, AddressData } from "@/hooks/useAddressInput";

interface AddressInputProps {
  onAddressChange: (address: AddressData) => void;
  initialAddress?: Partial<AddressData>;
  includeLabel?: boolean;
  includeCurrentLocation?: boolean;
  className?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  onAddressChange,
  initialAddress,
  includeLabel = true,
  includeCurrentLocation = true,
  className = "",
}) => {
  const {
    address,
    updateAddress,
    updatePincodeAndFetch,
    getCurrentLocationAddress,
    loading,
    error,
    setError,
  } = useAddressInput(initialAddress);

  const handlePincodeChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    updateAddress({ pincode: value });

    if (value.replace(/\D/g, "").length === 6) {
      await updatePincodeAndFetch(value);
    }
  };

  const handleAddressChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    field: keyof AddressData,
  ) => {
    const value = event.target.value;
    updateAddress({ [field]: value });
    onAddressChange({ ...address, [field]: value });
  };

  const handleGetCurrentLocation = async () => {
    setError(null);
    await getCurrentLocationAddress();
  };

  React.useEffect(() => {
    onAddressChange(address);
  }, [address, onAddressChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-gray-800">
          Pincode *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit pincode"
            value={address.pincode}
            onChange={handlePincodeChange}
            maxLength={6}
            autoComplete="postal-code"
            disabled={loading}
            className="h-12 flex-1 rounded-xl border border-emerald-200 px-4 text-sm font-semibold text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-100"
          />
          {includeCurrentLocation && (
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={loading}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-gray-300"
              title="Use current location"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <MapPinIcon className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">Current</span>
            </button>
          )}
        </div>
        {loading && (
          <p className="mt-2 text-xs font-medium text-emerald-700">
            Fetching location details...
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            City *
          </label>
          <input
            type="text"
            value={address.city}
            onChange={(event) => handleAddressChange(event, "city")}
            placeholder="City"
            disabled={loading}
            className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            State *
          </label>
          <input
            type="text"
            value={address.state}
            onChange={(event) => handleAddressChange(event, "state")}
            placeholder="State"
            disabled={loading}
            className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-800">
          Full Address *
        </label>
        <textarea
          value={address.address}
          onChange={(event) => handleAddressChange(event, "address")}
          placeholder="Street address, house number, landmark"
          disabled={loading}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-100"
        />
      </div>

      {includeLabel && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            Address Label
          </label>
          <select
            value={address.label || ""}
            onChange={(event) => handleAddressChange(event, "label")}
            disabled={loading}
            className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-gray-100"
          >
            <option value="">Select label</option>
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {address.city && address.state && !loading && !error && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Location verified: {address.city}, {address.state}
          </span>
        </div>
      )}
    </div>
  );
};

export default AddressInput;
