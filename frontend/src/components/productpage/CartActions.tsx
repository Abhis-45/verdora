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
}

export default function CartActions({
  cartItem,
  cartKey,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onGoToCart,
  onBuyNow,
}: CartActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-300 bg-white shadow-lg lg:static lg:border-0 lg:bg-transparent lg:shadow-none">
      <div className="mx-auto max-w-2xl px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] lg:mx-0 lg:max-w-none lg:px-0 lg:py-0">
        <div className="flex flex-col gap-2 sm:flex-row">
          {!cartItem ? (
            <button
              onClick={onAddToCart}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700"
            >
              <ShoppingCartIcon className="h-4 w-4" />
              Add to Cart
            </button>
          ) : (
            <>
              <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white">
                <button
                  onClick={() => {
                    const newQty = (cartItem?.quantity ?? 0) - 1;
                    if (newQty <= 0) {
                      onRemoveFromCart(cartItem.cartKey || cartKey);
                    } else {
                      onUpdateQuantity(cartItem.cartKey || cartKey, newQty);
                    }
                  }}
                  className="bg-gray-100 px-3 py-2 text-xs font-bold transition hover:bg-gray-200"
                >
                  -
                </button>
                <span className="w-10 text-center text-xs font-bold text-green-600">
                  {cartItem.quantity}
                </span>
                <button
                  onClick={() =>
                    onUpdateQuantity(
                      cartItem.cartKey || cartKey,
                      (cartItem.quantity ?? 0) + 1,
                    )
                  }
                  className="bg-gray-100 px-3 py-2 text-xs font-bold transition hover:bg-gray-200"
                >
                  +
                </button>
              </div>
              <button
                onClick={onGoToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700"
              >
                <ShoppingCartIcon className="h-4 w-4" />
                Go to cart
              </button>
            </>
          )}

          <button
            onClick={onBuyNow}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-950"
          >
            <BoltIcon className="h-4 w-4" />
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
