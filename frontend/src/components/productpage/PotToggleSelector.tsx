"use client";
import React from "react";
import { PlantSizeOption } from "@/utils/productOptions";

interface PotToggleSelectorProps {
  selectedSize: PlantSizeOption;
  includePot: boolean;
  onTogglePot: (includePot: boolean) => void;
}

export default function PotToggleSelector({
  selectedSize,
  includePot,
  onTogglePot,
}: PotToggleSelectorProps) {
  // Only show if vendor has explicitly added pot pricing
  if (!selectedSize.potPrice || selectedSize.potPrice <= 0) {
    return null;
  }

  const potPrice = selectedSize.potPrice;
  const potMrp = selectedSize.potMrp || 0;

  const plantOnlyPrice = selectedSize.price;
  const withPotPrice = plantOnlyPrice + potPrice;

  return (
    <div className="rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 p-2.5 border border-amber-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-amber-900">✨ Premium Pot Add-on</p>
        <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-semibold">
          +₹{potPrice}
        </span>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-1.5">
        {/* Plant Only Option */}
        <button
          onClick={() => onTogglePot(false)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
            !includePot
              ? "bg-white text-green-700 border-2 border-green-600 shadow-sm"
              : "bg-white/60 text-gray-600 border border-amber-300 hover:bg-white/80"
          }`}
        >
          Plant Only
          <div className="text-[10px] font-normal text-gray-600">₹{plantOnlyPrice}</div>
        </button>

        {/* With Pot Option */}
        <button
          onClick={() => onTogglePot(true)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
            includePot
              ? "bg-amber-600 text-white border-2 border-amber-700 shadow-md"
              : "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
          }`}
        >
          With Pot
          <div className="text-[10px] font-normal opacity-90">₹{withPotPrice}</div>
        </button>
      </div>

      {/* Info Text */}
      <p className="text-[10px] text-amber-800 mt-1.5 italic">
        🏺 Premium ceramic pot with drainage holes
      </p>
    </div>
  );
}
