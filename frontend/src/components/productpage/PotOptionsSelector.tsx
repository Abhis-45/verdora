"use client";
import React, { useState } from "react";
import { PlantSizeOption, PotOption } from "@/utils/productOptions";

interface PotOptionsSelectorProps {
  selectedSize: PlantSizeOption;
  selectedPotOption: PotOption | null;
  includePot: boolean;
  onTogglePot: (includePot: boolean) => void;
  onSelectPot: (pot: PotOption | null) => void;
}

export default function PotOptionsSelector({
  selectedSize,
  selectedPotOption,
  includePot,
  onTogglePot,
  onSelectPot,
}: PotOptionsSelectorProps) {
  // Check if there are multiple pot options
  const hasMultiplePots =
    Array.isArray(selectedSize.potOptions) && selectedSize.potOptions.length > 0;
  const potOptions = selectedSize.potOptions || [];

  // If no pot pricing, don't show anything
  if (!selectedSize.potPrice || selectedSize.potPrice <= 0) {
    return null;
  }

  const potName = selectedSize.potName || "Premium Ceramic Pot";
  const potImage = selectedSize.potImage;
  const potPrice = selectedSize.potPrice;
  const plantOnlyPrice = selectedSize.price;
  const withPotPrice = plantOnlyPrice + potPrice;

  return (
    <div className="rounded-lg bg-gradient-to-r from-amber-50 to-amber-100 p-3 border border-amber-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {potImage && (
            <img
              src={potImage}
              alt={potName}
              className="w-6 h-6 rounded object-cover border border-amber-300"
            />
          )}
          <div>
            <p className="text-xs font-bold text-amber-900">🏺 Pot Options</p>
            <p className="text-[10px] text-amber-700">{potName}</p>
          </div>
        </div>
        <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-semibold">
          +₹{potPrice}
        </span>
      </div>

      {/* Plant Only / With Pot Toggle */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => {
            onTogglePot(false);
            onSelectPot(null);
          }}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
            !includePot
              ? "bg-white text-green-700 border-2 border-green-600 shadow-sm"
              : "bg-white/60 text-gray-600 border border-amber-300 hover:bg-white/80"
          }`}
        >
          Plant Only
          <div className="text-[10px] font-normal text-gray-600">₹{plantOnlyPrice}</div>
        </button>

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

      {/* Multiple Pot Options Selection */}
      {includePot && hasMultiplePots && (
        <div className="space-y-2 pt-2 border-t border-amber-300">
          <p className="text-xs font-medium text-amber-800">Choose a pot:</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Default pot option */}
            <button
              onClick={() => onSelectPot(null)}
              className={`rounded-md p-2 text-xs transition-all border ${
                !selectedPotOption
                  ? "bg-amber-600 text-white border-amber-700 shadow-md"
                  : "bg-white border-amber-300 text-amber-900 hover:bg-amber-50"
              }`}
            >
              <div className="font-semibold">{potName}</div>
              <div className="text-[10px] opacity-90">₹{potPrice}</div>
            </button>

            {/* Custom pot options */}
            {potOptions.map((pot, index) => (
              <button
                key={index}
                onClick={() => onSelectPot(pot)}
                className={`rounded-md p-2 text-xs transition-all border ${
                  selectedPotOption?.name === pot.name
                    ? "bg-amber-600 text-white border-amber-700 shadow-md"
                    : "bg-white border-amber-300 text-amber-900 hover:bg-amber-50"
                }`}
              >
                <div className="flex items-center gap-1">
                  {pot.image && (
                    <img
                      src={pot.image}
                      alt={pot.name}
                      className="w-4 h-4 rounded object-cover"
                    />
                  )}
                  <span className="font-semibold">{pot.name}</span>
                </div>
                <div className="text-[10px] opacity-90">₹{pot.price}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single pot option display */}
      {includePot && !hasMultiplePots && (
        <p className="text-[10px] text-amber-800 italic">
          🏺 {potName} included with plant
        </p>
      )}
    </div>
  );
}
