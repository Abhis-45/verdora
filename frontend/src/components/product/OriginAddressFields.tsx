"use client";

import { useState } from "react";
import { DeliveryLocation, normalizePincode } from "@/utils/delivery";
import { fetchLocationFromPincode } from "@/utils/pincodeApi";

type OriginAddress = DeliveryLocation & {
  address: string;
};

const inputClassName =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

export default function OriginAddressFields({
  value,
  onChange,
}: {
  value: OriginAddress;
  onChange: (value: OriginAddress) => void;
}) {
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  const updateField = (field: keyof OriginAddress, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
    setPincodeError(null);
  };

  const handlePincodeChange = async (fieldValue: string) => {
    const normalizedPincode = normalizePincode(fieldValue);
    if (!normalizedPincode) {
      updateField("pincode", "");
      return;
    }

    updateField("pincode", normalizedPincode);

    // Fetch from API if full pincode entered
    if (normalizedPincode.length === 6) {
      setPincodeLoading(true);
      setPincodeError(null);
      try {
        const data = await fetchLocationFromPincode(normalizedPincode);
        if (data) {
          onChange({
            ...value,
            pincode: data.pincode,
            city: data.city,
            state: data.state,
            address: value.address || data.area || data.city,
          });
        } else {
          setPincodeError("Pincode not found. Please enter details manually.");
        }
      } catch (err) {
        setPincodeError("Error fetching location data");
        console.error(err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Shop Address
        </label>
        <input
          type="text"
          value={value.address || ""}
          onChange={(event) => updateField("address", event.target.value)}
          className={inputClassName}
          placeholder="Shop or nursery address"
          disabled={pincodeLoading}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          City
        </label>
        <input
          type="text"
          value={value.city || ""}
          onChange={(event) => updateField("city", event.target.value)}
          className={inputClassName}
          placeholder="Pune"
          disabled={pincodeLoading}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          State
        </label>
        <input
          type="text"
          value={value.state || ""}
          onChange={(event) => updateField("state", event.target.value)}
          className={inputClassName}
          placeholder="Maharashtra"
          disabled={pincodeLoading}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Pincode
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={value.pincode || ""}
          onChange={(event) => handlePincodeChange(event.target.value)}
          className={inputClassName}
          placeholder="411001"
          disabled={pincodeLoading}
        />
        <p className="mt-1 text-xs text-gray-500">
          {pincodeLoading
            ? "Fetching location..."
            : "Enter a 6-digit pincode to auto-fill city and state."}
        </p>
        {pincodeError && (
          <p className="mt-1 text-xs text-red-600">{pincodeError}</p>
        )}
        {value.pincode && value.city && !pincodeError && (
          <p className="mt-1 text-xs text-green-600">
            ✓ {value.city}, {value.state}
          </p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Country
        </label>
        <input
          type="text"
          value={value.country || "India"}
          onChange={(event) => updateField("country", event.target.value)}
          className={inputClassName}
          placeholder="India"
          disabled={pincodeLoading}
        />
      </div>
    </div>
  );
}
