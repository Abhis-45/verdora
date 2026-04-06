"use client";

import React from "react";
import { useAddressInput, AddressData } from "@/hooks/useAddressInput";
import { MapPinIcon } from "@heroicons/react/24/outline";

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
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    updateAddress({ pincode: value });

    if (value.length === 6) {
      await updatePincodeAndFetch(value);
    }
  };

  const handleAddressChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    field: keyof AddressData,
  ) => {
    const value = e.target.value;
    updateAddress({ [field]: value });
    onAddressChange({ ...address, [field]: value });
  };

  const handleGetCurrentLocation = async () => {
    await getCurrentLocationAddress();
    setError(null);
  };

  React.useEffect(() => {
    onAddressChange(address);
  }, [address, onAddressChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Pincode Input */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
            disabled={loading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          />
          {includeCurrentLocation && (
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 flex items-center gap-2"
              title="Use current location"
            >
              <MapPinIcon className="w-5 h-5" />
              {loading ? "📍" : ""}
            </button>
          )}
        </div>
        {loading && (
          <p className="text-sm text-blue-500 mt-1">Fetching location...</p>
        )}
      </div>

      {/* Auto-filled Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            value={address.city}
            onChange={(e) => handleAddressChange(e, "city")}
            placeholder="City"
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <input
            type="text"
            value={address.state}
            onChange={(e) => handleAddressChange(e, "state")}
            placeholder="State"
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Full Address */}
      <div className="form-group">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Address *
        </label>
        <textarea
          value={address.address}
          onChange={(e) => handleAddressChange(e, "address")}
          placeholder="Street address, house number, etc."
          disabled={loading}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
        />
      </div>

      {/* Label (Home, Office, etc.) */}
      {includeLabel && (
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Label
          </label>
          <select
            value={address.label || ""}
            onChange={(e) => handleAddressChange(e, "label")}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
          >
            <option value="">Select label</option>
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {address.city && address.state && !loading && !error && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
          ✓ Location verified: {address.city}, {address.state}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
