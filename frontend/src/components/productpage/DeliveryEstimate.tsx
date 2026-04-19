"use client";
import React, { useEffect, useState } from "react";
import { formatDeliveryDate } from "@/utils/delivery";
import { PincodeSuggestions } from "@/components/forms/PincodeSuggestions";
import { PincodeData } from "@/utils/pincodeApi";

interface DeliveryEstimateProps {
  deliveryEstimate: {
    origin: { city?: string; state?: string };
    estimatedDeliveryDate: Date;
    transitDays?: number;
  };
  deliveryLocationLabel: string;
  onPincodeChange: (value: string) => void;
  onSuggestionSelect: (data: PincodeData) => void;
}

export default function DeliveryEstimate({
  deliveryEstimate,
  deliveryLocationLabel,
  onSuggestionSelect,
}: DeliveryEstimateProps) {
  const [selectedLocation, setSelectedLocation] = useState(
    deliveryLocationLabel,
  );

  useEffect(() => {
    setSelectedLocation(deliveryLocationLabel);
  }, [deliveryLocationLabel]);

  const handleSelect = (data: PincodeData) => {
    setSelectedLocation(`${data.city}, ${data.state}`);
    onSuggestionSelect(data);
  };

  return (
    <div className="rounded-md bg-white/80 backdrop-blur-md shadow-sm p-3 sm:p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Delivery</p>
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          {formatDeliveryDate(deliveryEstimate.estimatedDeliveryDate)}
        </span>
      </div>

      <p className="text-xs text-gray-500">
        From {deliveryEstimate.origin.city}, {deliveryEstimate.origin.state}
      </p>

      <div className="flex flex-col sm:flex-row sm:items-stretch sm:gap-3 space-y-2 sm:space-y-0">
        <div className="flex-1">
          <PincodeSuggestions
            onSelect={handleSelect}
            placeholder="Enter pincode"
            className="relative"
            inputClassName="w-full rounded-md border border-gray-200 focus:border-green-500 focus:ring-green-400 text-sm text-gray-900"
          />
        </div>

        <div className="flex-1 rounded-md bg-green-50 px-3 py-2 flex flex-col justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">
            Delivering to
          </p>
          <p className="text-sm font-medium text-gray-900 truncate">
            {selectedLocation || "Enter pincode to fetch location"}
          </p>
        </div>
      </div>
    </div>
  );
}
