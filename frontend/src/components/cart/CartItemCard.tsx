/* eslint-disable @next/next/no-img-element */
"use client";
import { CartItem } from "@/types/types";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import Link from "next/link";

export default function CartItemCard({ item }: { item: CartItem }) {
  const { updateQuantity, removeFromCart } = useCart();
  const { addToWishlist } = useWishlist();

  return (
    <div
      className="flex flex-col bg-linear-to-br from-green-50 to-green-100 
                 border border-green-200 rounded-xl shadow-md hover:shadow-lg 
                 transition p-4 mb-4"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {item.image && (
            <Link href={`/productpage/${item.id}`}>
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg shadow-md border border-green-200 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          )}
          <div>
            <h2 className="text-sm font-semibold text-green-900 truncate max-w-37.5">
              {item.name}
            </h2>
            {item.slug && (
              <p className="text-xs text-gray-600">
                Service: {item.slug.replace("-", " ")}
              </p>
            )}
          </div>
        </div>
        <span className="text-sm font-bold text-emerald-600">
          ₹{item.price}
        </span>
      </div>

      {/* Nested Products */}
      {item.products && item.products.length > 0 && (
        <div className="mt-3 space-y-1 text-xs text-gray-700">
          {item.products.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span>
                {p.name} × {p.count}
              </span>
              <span>₹{p.count * p.price}</span>
            </div>
          ))}

          {item.deposit !== undefined && (
            <div className="flex justify-between font-medium text-emerald-600">
              <span>Security Deposit</span>
              <span>₹{item.deposit}</span>
            </div>
          )}

          {item.deliveryDate && item.deliveryTime && (
            <div className="flex justify-between font-medium text-blue-600">
              <span>Delivery Scheduled</span>
              <span>
                {item.deliveryDate} • {item.deliveryTime}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Controls Row */}
      <div className="flex items-center justify-between mt-4">
        {/* ✅ Packages: fixed quantity */}
        {item.slug ? (
          <span className="text-sm font-medium text-green-900">
            Quantity: 1
          </span>
        ) : (
          // ✅ Single products: increment/decrement
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="px-2 py-1 bg-gray-200 text-green-900 rounded-full hover:bg-gray-300 transition text-xs"
            >
              –
            </button>
            <span className="px-2 text-sm font-medium text-green-900">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="px-2 py-1 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition text-xs"
            >
              +
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              addToWishlist(item);
              removeFromCart(item.id);
            }}
            className="text-pink-500 hover:text-pink-600 transition text-sm"
          >
            ♥
          </button>
          <button
            onClick={() => removeFromCart(item.id)}
            className="text-red-500 hover:text-red-600 transition text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
