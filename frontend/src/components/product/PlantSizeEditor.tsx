"use client";

import { PlantSizeOption, PLANT_SIZE_PRESETS } from "@/utils/productOptions";
import { TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

const emptySize = (label = ""): PlantSizeOption => ({
  id: `${label || "custom"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  label,
  price: 0,
  mrp: 0,
  isDefault: false,
});

export default function PlantSizeEditor({
  sizes,
  onChange,
}: {
  sizes: PlantSizeOption[];
  onChange: (sizes: PlantSizeOption[]) => void;
}) {
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  const updateSize = (
    index: number,
    field: keyof PlantSizeOption,
    value: string | number | boolean,
  ) => {
    onChange(
      sizes.map((size, sizeIndex) =>
        sizeIndex === index
          ? {
              ...size,
              [field]:
                field === "label"
                  ? String(value).toUpperCase()
                  : field === "price" || field === "mrp"
                    ? Number(value)
                    : value,
            }
          : field === "isDefault"
            ? { ...size, isDefault: false }
            : size,
      ),
    );
  };

  const addPreset = (label: string) => {
    if (sizes.some((size) => size.label === label)) return;
    onChange([
      ...sizes,
      {
        ...emptySize(label),
        label,
        isDefault: sizes.length === 0,
      },
    ]);
  };

  const addCustom = () => {
    onChange([
      ...sizes,
      {
        ...emptySize(""),
        isDefault: sizes.length === 0,
      },
    ]);
  };

  const removeSize = (index: number) => {
    const next = sizes.filter((_, sizeIndex) => sizeIndex !== index);
    if (next.length > 0 && !next.some((size) => size.isDefault)) {
      next[0].isDefault = true;
    }
    onChange(next);
    setConfirmIndex(null);
  };

  return (
    <div className="space-y-4 rounded-xl border border-green-200 bg-green-50/60 p-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {PLANT_SIZE_PRESETS.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => addPreset(size)}
            className="rounded-full border border-green-300 bg-white px-2 py-0.5 text-xs font-semibold text-green-700 transition hover:border-green-500 hover:text-green-900"
          >
            + {size}
          </button>
        ))}
        <button
          type="button"
          onClick={addCustom}
          className="rounded-full border border-dashed border-green-400 px-2 py-0.5 text-xs font-semibold text-green-700 transition hover:bg-white"
        >
          + Custom size
        </button>
      </div>

      {/* Size Cards */}
      <div className="space-y-3">
        {sizes.map((size, index) => (
          <div
            key={size.id}
            className="rounded-xl border border-green-200 bg-white p-3 
                       flex flex-col gap-2 md:flex-row md:items-center md:gap-3"
          >
            {/* Size */}
            <input
              type="text"
              value={size.label}
              onChange={(event) =>
                updateSize(index, "label", event.target.value)
              }
              placeholder="Size"
              className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-green-500"
            />

            {/* Price + MRP (inline on desktop, one row together on mobile) */}
            <div className="flex gap-2 md:flex-row">
              <input
                type="number"
                value={size.price || ""}
                onChange={(event) =>
                  updateSize(index, "price", event.target.value)
                }
                placeholder="Price"
                className="w-[122px] md:w-[100px] rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <input
                type="number"
                value={size.mrp || ""}
                onChange={(event) =>
                  updateSize(index, "mrp", event.target.value)
                }
                placeholder="MRP"
                className={`w-[122px] md:w-[100px] rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 ${
                  size.mrp < size.price
                    ? "border-red-400 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:ring-green-500"
                }`}
              />
            </div>
            {size.mrp < size.price && (
              <p className="text-xs text-red-600 font-medium -mt-2">
                MRP must be ≥ Price
              </p>
            )}

            {/* Default + Delete */}
            <div className="flex items-center justify-between md:justify-start md:gap-4 flex-1">
              <label className="flex items-center gap-1 text-xs font-medium text-green-800">
                <input
                  type="radio"
                  name="defaultPlantSize"
                  checked={Boolean(size.isDefault)}
                  onChange={() => updateSize(index, "isDefault", true)}
                />
                Default
              </label>

              {confirmIndex === index ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    className="flex items-center justify-center rounded-md bg-red-100 p-1 text-red-700 hover:bg-red-200"
                    aria-label="Confirm remove"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmIndex(null)}
                    className="flex items-center justify-center rounded-md bg-gray-100 p-1 text-gray-700 hover:bg-gray-200"
                    aria-label="Cancel remove"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmIndex(index)}
                  className="flex items-center justify-center rounded-md border border-red-200 p-1 text-red-600 transition hover:bg-red-50"
                  aria-label="Remove size"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
