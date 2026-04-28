"use client";

import { PlantSizeOption, PLANT_SIZE_PRESETS } from "@/utils/productOptions";
import { TrashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

const emptySize = (label = ""): PlantSizeOption => ({
  id: `${label || "custom"}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  label,
  price: 0,
  mrp: 0,
  potPrice: 0,
  potMrp: 0,
  potName: "",
  potImage: "",
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
                       flex flex-col gap-2"
          >
            {/* First Row: Size Label */}
            <div>
              <input
                type="text"
                value={size.label}
                onChange={(event) =>
                  updateSize(index, "label", event.target.value)
                }
                placeholder="Size"
                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm uppercase focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Second Row: Plant Price + MRP */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-600 font-medium block mb-1">Plant Price</label>
                <input
                  type="number"
                  value={size.price || ""}
                  onChange={(event) =>
                    updateSize(index, "price", event.target.value)
                  }
                  placeholder="Price"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600 font-medium block mb-1">Plant MRP</label>
                <input
                  type="number"
                  value={size.mrp || ""}
                  onChange={(event) =>
                    updateSize(index, "mrp", event.target.value)
                  }
                  placeholder="MRP"
                  className={`w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 ${
                    size.mrp < size.price
                      ? "border-red-400 focus:ring-red-500 bg-red-50"
                      : "border-gray-300 focus:ring-green-500"
                  }`}
                />
              </div>
            </div>
            {size.mrp < size.price && (
              <p className="text-xs text-red-600 font-medium">
                Plant MRP must be ≥ Plant Price
              </p>
            )}

            {/* Third Row: Pot Name (Optional) */}
            <div className="border-t pt-2">
              <label className="text-xs text-amber-700 font-medium block mb-1">
                Pot Name <span className="text-gray-500 font-normal">optional</span>
              </label>
              <input
                type="text"
                value={(size.potName as string) || ""}
                onChange={(event) =>
                  updateSize(index, "potName", event.target.value)
                }
                placeholder="e.g., Ceramic Pot, Terracotta Pot, Plastic Pot"
                className="w-full rounded-md border border-amber-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50"
              />
            </div>

            {/* Fourth Row: Pot Price + Pot MRP (Optional) */}
            <div className="flex gap-2 border-t pt-2">
              <div className="flex-1">
                <label className="text-xs text-amber-700 font-medium block mb-1">
                  Pot Price (₹) <span className="text-gray-500 font-normal">optional</span>
                </label>
                <input
                  type="number"
                  value={(size.potPrice as number) || ""}
                  onChange={(event) =>
                    updateSize(index, "potPrice", event.target.value)
                  }
                  placeholder="Leave empty if no pot"
                  min="0"
                  className="w-full rounded-md border border-amber-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-amber-50"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-amber-700 font-medium block mb-1">
                  Pot MRP (₹) <span className="text-gray-500 font-normal">optional</span>
                </label>
                <input
                  type="number"
                  value={(size.potMrp as number) || ""}
                  onChange={(event) =>
                    updateSize(index, "potMrp", event.target.value)
                  }
                  placeholder="Leave empty if no pot"
                  min="0"
                  className={`w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 bg-amber-50 ${
                    (size.potMrp as number) < (size.potPrice as number)
                      ? "border-red-400 focus:ring-red-500"
                      : "border-amber-300 focus:ring-amber-500"
                  }`}
                />
              </div>
            </div>
            {(size.potMrp as number) > 0 && (size.potMrp as number) < (size.potPrice as number) && (
              <p className="text-xs text-red-600 font-medium">
                Pot MRP must be ≥ Pot Price
              </p>
            )}

            {/* Sixth Row: Multiple Pot Options (Advanced) */}
            {size.potPrice > 0 && (
              <div className="border-t pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-amber-700 font-medium">
                    Multiple Pot Options <span className="text-gray-500 font-normal">advanced</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentPots = size.potOptions || [];
                      updateSize(index, "potOptions", [
                        ...currentPots,
                        { name: "", price: 0, mrp: 0, image: "" }
                      ]);
                    }}
                    className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded hover:bg-amber-200"
                  >
                    + Add Pot Option
                  </button>
                </div>

                {(size.potOptions || []).map((pot, potIndex) => (
                  <div key={potIndex} className="mb-2 p-2 bg-amber-50 rounded border border-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-amber-800">Pot Option {potIndex + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const currentPots = size.potOptions || [];
                          updateSize(index, "potOptions", currentPots.filter((_, i) => i !== potIndex));
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Pot name"
                        value={pot.name}
                        onChange={(event) => {
                          const currentPots = size.potOptions || [];
                          const updatedPots = [...currentPots];
                          updatedPots[potIndex] = { ...pot, name: event.target.value };
                          updateSize(index, "potOptions", updatedPots);
                        }}
                        className="w-full rounded border border-amber-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <input
                        type="url"
                        placeholder="Image URL"
                        value={pot.image || ""}
                        onChange={(event) => {
                          const currentPots = size.potOptions || [];
                          const updatedPots = [...currentPots];
                          updatedPots[potIndex] = { ...pot, image: event.target.value };
                          updateSize(index, "potOptions", updatedPots);
                        }}
                        className="w-full rounded border border-amber-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Price"
                        value={pot.price || ""}
                        onChange={(event) => {
                          const currentPots = size.potOptions || [];
                          const updatedPots = [...currentPots];
                          updatedPots[potIndex] = { ...pot, price: Number(event.target.value) };
                          updateSize(index, "potOptions", updatedPots);
                        }}
                        min="0"
                        className="w-full rounded border border-amber-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <input
                        type="number"
                        placeholder="MRP"
                        value={pot.mrp || ""}
                        onChange={(event) => {
                          const currentPots = size.potOptions || [];
                          const updatedPots = [...currentPots];
                          updatedPots[potIndex] = { ...pot, mrp: Number(event.target.value) };
                          updateSize(index, "potOptions", updatedPots);
                        }}
                        min="0"
                        className="w-full rounded border border-amber-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                ))}

                {(size.potOptions || []).length === 0 && (
                  <p className="text-[10px] text-amber-600">
                    Add multiple pot options for customers to choose from
                  </p>
                )}
              </div>
            )}

            {/* Seventh Row: Default + Delete */}
            <div className="flex items-center justify-between border-t pt-2">
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
