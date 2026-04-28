"use client";

import Image from "next/image";
import Link from "next/link";
import { PlantSizeOption, PotOption } from "@/utils/productOptions";
import { ProductItem } from "../../types/ProductItem";
import { useWishlist } from "../../context/WishlistContext";

export default function CartItemsList({
  cartItems,
  onUpdate,
  onChangeSize,
  onTogglePot,
  onRemove,
  onClear,
}: {
  cartItems: ProductItem[];
  onUpdate: (id: number | string, newQuantity: number) => void;
  onChangeSize: (id: number | string, nextSize: PlantSizeOption) => void;
  onTogglePot: (
    id: number | string,
    includePot: boolean,
    selectedPotOption?: PotOption | null,
  ) => void;
  onRemove: (id: number | string) => void;
  onClear: () => void;
}) {
  const { wishlist, addToWishlist, moveToCart } = useWishlist();

  return (
    <div className="overflow-hidden rounded-lg border border-green-200 bg-white shadow-md">
      <div className="border-b border-green-200 bg-linear-to-r from-green-100 to-green-50 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-green-900 sm:text-xl">
            Cart Items ({cartItems.length})
          </h2>
          {cartItems.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs font-semibold text-red-600 transition hover:text-red-700 sm:text-sm"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {cartItems.map((item) => {
          const itemKey = item.cartKey || item.id;
          const wishlistMatch = wishlist.some(
            (entry) => String(entry.id) === String(item.productId || item.id),
          );
          const canManagePot = (item.selectedSize?.potPrice || 0) > 0;

          return (
            <div
              key={String(itemKey)}
              className="px-4 py-5 transition hover:bg-green-50 sm:px-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-1 items-center gap-3">
                  {item.image && (
                    <Link href={`/productpage/${item.id}`}>
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="h-14 w-14 shrink-0 cursor-pointer rounded-md object-cover shadow-sm transition-opacity hover:opacity-80 sm:h-16 sm:w-16"
                      />
                    </Link>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium text-green-900 sm:text-base">
                      {item.name}
                    </span>
                    {item.selectedSize?.label && (
                      <span className="block text-xs font-semibold text-green-700">
                        Size: {item.selectedSize.label}
                      </span>
                    )}
                    {item.includePot ? (
                      <span className="block text-xs font-semibold text-amber-700">
                        With {item.selectedPotOption?.name || item.selectedSize?.potName || "Pot"} (+₹
                        {item.selectedPotOption?.price || item.selectedSize?.potPrice || 0})
                      </span>
                    ) : canManagePot ? (
                      <span className="block text-xs font-semibold text-gray-600">
                        Pot not included with plant
                      </span>
                    ) : null}

                    {item.plantSizes && item.plantSizes.length > 0 && (
                      <label className="mt-2 block text-xs text-gray-600">
                        <span className="mb-1 block font-semibold text-gray-700">
                          Change size
                        </span>
                        <select
                          value={item.selectedSize?.id || item.plantSizes[0]?.id}
                          onChange={(event) => {
                            const nextSize = item.plantSizes?.find(
                              (size) => size.id === event.target.value,
                            );
                            if (nextSize) {
                              onChangeSize(itemKey, nextSize);
                            }
                          }}
                          className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-medium text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          {item.plantSizes.map((size) => (
                            <option key={size.id} value={size.id}>
                              {size.label} - ₹{size.price}
                              {size.potPrice && size.potPrice > 0 ? " (+pot available)" : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {canManagePot && (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2">
                        <div className="mb-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onTogglePot(itemKey, false, null)}
                            className={`rounded px-2 py-1 text-[11px] font-semibold ${
                              !item.includePot
                                ? "bg-white text-green-700 ring-1 ring-green-600"
                                : "bg-white/70 text-gray-700 ring-1 ring-amber-300"
                            }`}
                          >
                            Plant Only
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onTogglePot(itemKey, true, item.selectedPotOption || null)
                            }
                            className={`rounded px-2 py-1 text-[11px] font-semibold ${
                              item.includePot
                                ? "bg-amber-600 text-white ring-1 ring-amber-700"
                                : "bg-amber-100 text-amber-900 ring-1 ring-amber-300"
                            }`}
                          >
                            With Pot
                          </button>
                        </div>

                        {item.includePot &&
                          Array.isArray(item.selectedSize?.potOptions) &&
                          item.selectedSize.potOptions.length > 0 && (
                            <select
                              value={item.selectedPotOption?.name || "default"}
                              onChange={(event) => {
                                const selectedName = event.target.value;
                                const selectedOption =
                                  selectedName === "default"
                                    ? null
                                    : item.selectedSize?.potOptions?.find(
                                        (pot) => pot.name === selectedName,
                                      ) || null;
                                onTogglePot(itemKey, true, selectedOption);
                              }}
                              className="w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                              <option value="default">
                                {item.selectedSize?.potName || "Default Pot"} (+₹
                                {item.selectedSize?.potPrice || 0})
                              </option>
                              {item.selectedSize.potOptions.map((pot) => (
                                <option key={pot.name} value={pot.name}>
                                  {pot.name} (+₹{pot.price})
                                </option>
                              ))}
                            </select>
                          )}
                      </div>
                    )}

                    {item.mrp ? (
                      <span className="block text-xs text-gray-400 line-through">
                        MRP: ₹{item.mrp}
                      </span>
                    ) : null}
                    <span className="block text-xs text-gray-600 sm:text-sm">
                      Price: ₹{item.price}
                    </span>
                    <span className="block text-xs font-semibold text-emerald-700 sm:text-sm">
                      Subtotal: ₹{item.price * item.quantity}
                    </span>
                    {item.deliveryEstimate?.estimatedDeliveryDate && (
                      <span className="block text-xs text-blue-700">
                        Delivery by{" "}
                        {new Date(item.deliveryEstimate.estimatedDeliveryDate).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdate(itemKey, Math.max(item.quantity - 1, 1))}
                      className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-200"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-green-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdate(itemKey, item.quantity + 1)}
                      className="rounded-full bg-green-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-green-700"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (!wishlistMatch) {
                        addToWishlist(item);
                      } else {
                        moveToCart(item);
                      }
                      onRemove(itemKey);
                    }}
                    className={`rounded px-2 py-1 text-xs font-semibold transition ${
                      wishlistMatch
                        ? "text-green-600 hover:bg-green-50 hover:text-green-700"
                        : "text-pink-600 hover:bg-pink-50 hover:text-pink-700"
                    }`}
                  >
                    {wishlistMatch ? "In Wishlist" : "Save"}
                  </button>

                  <button
                    onClick={() => onRemove(itemKey)}
                    className="shrink-0 rounded-full p-1 text-sm font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
