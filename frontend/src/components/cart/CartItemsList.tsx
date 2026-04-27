"use client";

import Image from "next/image";
import Link from "next/link";
import { PlantSizeOption } from "@/utils/productOptions";
import { ProductItem } from "../../types/ProductItem";
import { useWishlist } from "../../context/WishlistContext";

export default function CartItemsList({
  cartItems,
  onUpdate,
  onChangeSize,
  onRemove,
  onClear,
}: {
  cartItems: ProductItem[];
  onUpdate: (id: number | string, newQuantity: number) => void;
  onChangeSize: (id: number | string, nextSize: PlantSizeOption) => void;
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
                        className="h-14 w-14 shrink-0 rounded-md object-cover shadow-sm cursor-pointer hover:opacity-80 transition-opacity sm:h-16 sm:w-16"
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
                    {item.includePot && (
                      <span className="block text-xs font-semibold text-amber-700">
                        With Premium Pot (+₹{item.selectedSize?.potPrice || 0})
                      </span>
                    )}
                    {item.plantSizes && item.plantSizes.length > 0 && (
                      <label className="mt-2 block text-xs text-gray-600">
                        <span className="mb-1 block font-semibold text-gray-700">
                          Change size
                        </span>
                        <select
                          value={
                            item.selectedSize?.id || item.plantSizes[0]?.id
                          }
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
                              {size.potPrice && size.potPrice > 0 && " (+pot available)"}
                            </option>
                          ))}
                        </select>
                      </label>
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
                        {new Date(
                          item.deliveryEstimate.estimatedDeliveryDate,
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        onUpdate(itemKey, Math.max(item.quantity - 1, 1))
                      }
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
