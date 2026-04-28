"use client";
import React from "react";
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
  const hasMultiplePots =
    Array.isArray(selectedSize.potOptions) && selectedSize.potOptions.length > 0;
  const potOptions = selectedSize.potOptions || [];

  if (!selectedSize.potPrice || selectedSize.potPrice <= 0) {
    return null;
  }

  const potName = selectedSize.potName || "Normal Pot";
  const potImage = selectedSize.potImage;
  const potPrice = selectedSize.potPrice;
  const plantOnlyPrice = selectedSize.price;
  const withPotPrice = plantOnlyPrice + potPrice;

  return (
    <div className="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {potImage && (
            <img
              src={potImage}
              alt={potName}
              className="h-6 w-6 rounded border border-amber-300 object-cover"
            />
          )}
          <div>
            <p className="text-xs font-bold text-amber-900">Pot Options</p>
            {/* <p className="text-[10px] text-amber-700">{potName}</p> */}
          </div>
        </div>
        <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          +₹{potPrice}
        </span>
      </div>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => {
            onTogglePot(false);
            onSelectPot(null);
          }}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
            !includePot
              ? "border-2 border-green-600 bg-white text-green-700 shadow-sm"
              : "border border-amber-300 bg-white/60 text-gray-600 hover:bg-white/80"
          }`}
        >
          Plant Only
          <div className="text-[10px] font-normal text-gray-600">₹{plantOnlyPrice}</div>
        </button>

        <button
          onClick={() => onTogglePot(true)}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
            includePot
              ? "border-2 border-amber-700 bg-amber-600 text-white shadow-md"
              : "border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
          }`}
        >
          With Pot
          <div className="text-[10px] font-normal opacity-90">₹{withPotPrice}</div>
        </button>
      </div>

      {includePot && hasMultiplePots && (
        <div className="space-y-2 border-t border-amber-300 pt-2">
          <p className="text-xs font-medium text-amber-800">Choose a pot:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onSelectPot(null)}
              className={`rounded-md border p-2 text-xs transition-all ${
                !selectedPotOption
                  ? "border-amber-700 bg-amber-600 text-white shadow-md"
                  : "border-amber-300 bg-white text-amber-900 hover:bg-amber-50"
              }`}
            >
              <div className="font-semibold">{potName}</div>
              <div className="text-[10px] opacity-90">₹{potPrice}</div>
            </button>

            {potOptions.map((pot, index) => (
              <button
                key={index}
                onClick={() => onSelectPot(pot)}
                className={`rounded-md border p-2 text-xs transition-all ${
                  selectedPotOption?.name === pot.name
                    ? "border-amber-700 bg-amber-600 text-white shadow-md"
                    : "border-amber-300 bg-white text-amber-900 hover:bg-amber-50"
                }`}
              >
                <div className="flex items-center gap-1">
                  {pot.image && (
                    <img
                      src={pot.image}
                      alt={pot.name}
                      className="h-4 w-4 rounded object-cover"
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

      {includePot && !hasMultiplePots && (
        <p className="text-[10px] italic text-amber-800">{potName} included with plant</p>
      )}
      {!includePot && (
        <p className="text-[10px] italic text-gray-700">Pot not included with plant</p>
      )}
    </div>
  );
}
