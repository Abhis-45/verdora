"use client";

import { CartItem } from "../../types/types";

export default function CartSummary({
  cartItems,
  coupon,
  setCoupon,
  feedback,
  handleApplyCoupon,
  couponDiscount,
  totalDiscount,
  finalAmount,
  estimatedDeliveryText,
  onCheckout,
}: {
  cartItems: CartItem[];
  coupon: string;
  setCoupon: (val: string) => void;
  feedback: string | null;
  handleApplyCoupon: (e: React.FormEvent) => void;
  couponDiscount: number;
  totalDiscount: number;
  finalAmount: number;
  estimatedDeliveryText?: string | null;
  onCheckout?: () => void;
}) {
  const productTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="rounded-2xl border border-green-200 bg-linear-to-br from-green-50 to-green-100 p-4 shadow-md sm:p-6 md:p-8">
      <h2 className="mb-4 text-lg font-bold text-green-900 sm:mb-6 sm:text-2xl">
        Order Summary
      </h2>

      <form
        onSubmit={handleApplyCoupon}
        className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row"
      >
        <input
          type="text"
          value={coupon}
          onChange={(event) => setCoupon(event.target.value)}
          placeholder="Enter coupon code"
          className="grow rounded-lg border border-green-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-lg bg-green-600 px-4 py-2 text-sm text-white shadow transition hover:scale-105"
        >
          Apply
        </button>
      </form>

      {feedback && (
        <p className="mt-2 text-xs text-green-700 sm:text-sm">{feedback}</p>
      )}

      <div className="space-y-2 text-sm text-gray-700 sm:space-y-3 sm:text-base">
        <div className="flex justify-between text-xs sm:text-sm">
          <span>Products Total</span>
          <span>₹{productTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-green-600 sm:text-sm">
          <span>Coupon Discount</span>
          <span>-₹{couponDiscount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs font-semibold text-green-700 sm:text-sm">
          <span>Total Discount</span>
          <span>-₹{totalDiscount.toFixed(2)}</span>
        </div>
        {estimatedDeliveryText && (
          <div className="flex justify-between text-xs font-medium text-blue-700 sm:text-sm">
            <span>Estimated Delivery</span>
            <span>{estimatedDeliveryText}</span>
          </div>
        )}
        <div className="flex justify-between border-t pt-3 text-base font-bold text-green-800 sm:pt-4 sm:text-lg">
          <span>Grand Total</span>
          <span>₹{finalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="mb-2 mt-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          Payment Method
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="radio"
            name="payment"
            id="pod"
            checked
            readOnly
            className="mt-0.5"
          />
          <label htmlFor="pod" className="text-sm font-medium text-gray-800">
            Pay on Delivery (POD)
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Only Cash on Delivery is available for checkout.
        </p>
      </div>

      <button
        onClick={() => onCheckout && onCheckout()}
        className="mt-6 w-full rounded-xl bg-linear-to-r from-green-400 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow transition-transform hover:scale-105 sm:mt-8 sm:text-base"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
