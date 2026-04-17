"use client";
import { useState, useEffect } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";

interface AvailableCoupon {
  _id?: string;
  couponCode: string;
  fixedDiscount: number;
  percentageDiscount: number;
  maxDiscountAmount: number;
  minCartValue: number;
  expiryDate?: string;
}

interface CouponValidation {
  code: string;
  discount: number;
  fixedDiscount: number;
  percentageDiscount: number;
  maxDiscountAmount: number;
  minCartValue: number;
  expiryDate?: string;
}

export default function AvailableCoupons({
  cartTotal,
  appliedCoupon,
  onApplyCoupon,
  token,
  backendUrl,
  userUsageInfo,
}: {
  cartTotal: number;
  appliedCoupon: CouponValidation | null;
  onApplyCoupon: (coupon: CouponValidation) => void;
  token: string;
  backendUrl: string;
  userUsageInfo?: {
    usedCount: number;
    remainingUses: number;
    maxUsagePerUser: number;
  } | null;
}) {
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAvailableCoupons = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${backendUrl}/api/coupon-user/available`);

        if (res.ok) {
          const data = await res.json();
          setAvailableCoupons(Array.isArray(data) ? data : []);
          setError("");
        } else {
          setError("Failed to load available coupons");
        }
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableCoupons();
  }, [backendUrl]);

  const handleApplyQuickCoupon = async (couponCode: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/coupon-user/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          couponCode,
          cartTotal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onApplyCoupon(data.coupon);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to apply coupon");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <p className="text-sm text-gray-600">Loading available coupons...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="w-5 h-5 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900">Available Coupons</h3>
      </div>

      {error && (
        <p className="text-xs text-red-600 mb-3">{error}</p>
      )}

      {appliedCoupon && (
        <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 rounded">
          <p className="text-xs font-semibold text-green-800">
            ✓ {appliedCoupon.code} Applied
          </p>
          <p className="text-sm font-bold text-green-700 mt-1">
            Discount: ₹{appliedCoupon.discount.toFixed(2)}
          </p>
          {userUsageInfo && userUsageInfo.maxUsagePerUser > 1 && (
            <p className="text-xs text-green-700 mt-1">
              Used {userUsageInfo.usedCount} of {userUsageInfo.maxUsagePerUser} times
            </p>
          )}
        </div>
      )}

      {availableCoupons.length === 0 ? (
        <p className="text-xs text-gray-600">No coupons available</p>
      ) : (
        <div className="space-y-2">
          {availableCoupons.map((coupon) => {
            const isEligible = cartTotal >= coupon.minCartValue;
            const discountText =
              coupon.fixedDiscount > 0
                ? `₹${coupon.fixedDiscount}`
                : `${coupon.percentageDiscount}%`;

            return (
              <div
                key={coupon._id || coupon.couponCode}
                className={`p-3 rounded-lg border-2 transition ${
                  isEligible && !appliedCoupon
                    ? "border-blue-300 bg-white hover:border-blue-500 cursor-pointer"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {coupon.couponCode}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Save {discountText}
                      {coupon.maxDiscountAmount > 0 && (
                        <span> (Max ₹{coupon.maxDiscountAmount})</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Min ₹{coupon.minCartValue} purchase
                    </p>
                  </div>
                  {isEligible && !appliedCoupon ? (
                    <button
                      onClick={() => handleApplyQuickCoupon(coupon.couponCode)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-semibold transition"
                    >
                      Apply
                    </button>
                  ) : !isEligible ? (
                    <span className="text-xs text-red-600 font-semibold">
                      Not Eligible
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-semibold">
                      Applied ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
