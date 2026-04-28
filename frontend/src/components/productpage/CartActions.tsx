"use client";
import React from "react";
import { ShoppingCartIcon, BoltIcon } from "@heroicons/react/24/outline";

interface CartItem {
  cartKey?: string;
  id?: string | number;
  quantity: number;
}

interface CartActionsProps {
  cartItem?: CartItem;
  cartKey: string;
  onAddToCart: () => void;
  onUpdateQuantity: (cartKey: string, newQty: number) => void;
  onRemoveFromCart: (cartKey: string) => void;
  onGoToCart: () => void;
  onBuyNow: () => void;
  isAvailable?: boolean;
}

export default function CartActions({
  cartItem,
  cartKey,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onGoToCart,
  onBuyNow,
  isAvailable = true,
}: CartActionsProps) {
  const renderButtons = () => (
    <>
      {!cartItem ? (
        <button
          onClick={onAddToCart}
          disabled={!isAvailable}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 px-2 py-2 text-xs font-semibold text-white shadow transition hover:bg-green-700 min-h-10 sm:px-4 sm:py-2.5 sm:text-sm sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isAvailable ? "Product is out of stock" : "Add to Cart"}
        >
          <ShoppingCartIcon className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Add to Cart</span>
        </button>
      ) : (
        <>
          <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white shrink-0">
            <button
              onClick={() => {
                const newQty = (cartItem?.quantity ?? 0) - 1;
                if (newQty <= 0) {
                  onRemoveFromCart(cartItem.cartKey || cartKey);
                } else {
                  onUpdateQuantity(cartItem.cartKey || cartKey, newQty);
                }
              }}
              className="bg-gray-100 px-2 py-1.5 text-xs font-bold transition hover:bg-gray-200 sm:px-3 sm:py-2 min-h-10 sm:min-h-auto"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-bold text-green-600 sm:w-10 sm:text-sm">
              {cartItem.quantity}
            </span>
            <button
              onClick={() =>
                onUpdateQuantity(
                  cartItem.cartKey || cartKey,
                  (cartItem.quantity ?? 0) + 1,
                )
              }
              className="bg-gray-100 px-2 py-1.5 text-xs font-bold transition hover:bg-gray-200 sm:px-3 sm:py-2 min-h-10 sm:min-h-auto"
            >
              +
            </button>
          </div>
          <button
            onClick={onGoToCart}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-900 px-2 py-2 text-xs font-semibold text-white shadow transition hover:bg-green-700 min-h-10 sm:px-4 sm:py-2.5 sm:text-sm sm:gap-2"
          >
            <ShoppingCartIcon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Go to Cart</span>
          </button>
        </>
      )}

      <button
        onClick={onBuyNow}
        disabled={!isAvailable}
        className="flex items-center justify-center gap-1 rounded-lg bg-emerald-900 px-2 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-950 min-h-10 sm:px-4 sm:py-2.5 sm:text-sm sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title={!isAvailable ? "Product is out of stock" : "Buy Now"}
      >
        <BoltIcon className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Buy Now</span>
      </button>
    </>
  );

  return (
    <>
      {/* Mobile fixed bar */}
      <div className="lg:hidden">
        <div className="flex flex-row gap-2">
          {renderButtons()}
        </div>
      </div>

      {/* Desktop inline */}
      <div className="hidden lg:block">
        <div className="flex flex-col gap-2 sm:flex-row">
          {renderButtons()}
        </div>
      </div>
    </>
  );
}
