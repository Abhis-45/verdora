"use client";
import React from "react";
import { PlantSizeOption } from "@/utils/productOptions";

interface PlantSizeSelectorProps {
  sizes: PlantSizeOption[];
  selectedSize: PlantSizeOption;
  onSelectSize: (size: PlantSizeOption) => void;
}

export default function PlantSizeSelector({
  sizes,
  selectedSize,
  onSelectSize,
}: PlantSizeSelectorProps) {
  return (
    <div className="space-y-2 relative">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Available Size</h3>
        <span className="text-xs text-gray-500">Select a variant</span>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-start">
        {sizes.map((size) => {
          const isSelected = selectedSize.id === size.id;
          return (
            <button
              key={size.id}
              onClick={() => onSelectSize(size)}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200
                ${
                  isSelected
                    ? "border-green-600 bg-linear-to-r from-green-600 to-green-500 text-white shadow-md hover:shadow-lg"
                    : "border-gray-200 bg-white text-gray-800 hover:border-green-400 hover:bg-green-50"
                }
              `}
            >
              {size.label} • ₹{size.price}
            </button>
          );
        })}
      </div>
    </div>
  );
}
