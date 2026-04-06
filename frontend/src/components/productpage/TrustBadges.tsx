"use client";
import React from "react";
import {
  TruckIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

interface TrustBadgesProps {
  deliveryEstimate: {
    transitDays?: number;
  };
}

export default function TrustBadges({ deliveryEstimate }: TrustBadgesProps) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      <div className="flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-center gap-2 rounded-md bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2 hover:shadow-md transition">
        <TruckIcon className="h-6 w-6 text-blue-600" />
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-gray-900">Fast Delivery</p>
          <p className="text-xs text-gray-600">
            {deliveryEstimate.transitDays} day dispatch estimate
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-center gap-2 rounded-md bg-gradient-to-r from-green-50 to-green-100 px-3 py-2 hover:shadow-md transition">
        <ShieldCheckIcon className="h-6 w-6 text-green-600" />
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-gray-900">100% Secure</p>
          <p className="text-xs text-gray-600">Safe payment</p>
        </div>
      </div>

      <div className="flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-center gap-2 rounded-md bg-gradient-to-r from-emerald-50 to-emerald-100 px-3 py-2 hover:shadow-md transition">
        <GlobeAltIcon className="h-6 w-6 text-emerald-600" />
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-gray-900">Eco‑friendly</p>
          <p className="text-xs text-gray-600">Sustainable packaging</p>
        </div>
      </div>
    </div>
  );
}
