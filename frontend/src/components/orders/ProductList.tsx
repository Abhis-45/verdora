/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Link from "next/link";
import ReviewForm from "./ReviewForm";

export default function ProductList({
  items,
  delivered,
}: {
  items: any[];
  delivered: boolean;
}) {
  const [reviews, setReviews] = useState<{ [key: string]: any[] }>({});

  const handleReviewSubmit = (review: any) => {
    setReviews((prev) => ({
      ...prev,
      [review.productId]: [...(prev[review.productId] || []), review],
    }));
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition"
        >
          {/* Product Image */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-md overflow-hidden shrink-0">
            {item.image ? (
              <Link href={`/productpage/${item.id}`}>
                <img
                  src={item.image}
                  alt={item.title || "Product"}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                No Image
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {item.title || "Product"}
            </h4>
            <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
            <div className="text-xs font-semibold text-green-700 mt-1">
              Subtotal: ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
            </div>

            {/* Reviews */}
            {delivered && (
              <div className="mt-2">
                <ReviewForm productId={item.id} onSubmit={handleReviewSubmit} />
                {reviews[item.id]?.map((r, i) => (
                  <div key={i} className="mt-2 text-xs border-t pt-2">
                    <div className="flex gap-1 text-yellow-500">
                      {"★".repeat(r.rating)}
                      {"☆".repeat(5 - r.rating)}
                    </div>
                    <p className="text-gray-700">{r.comment}</p>
                    <p className="text-[10px] text-gray-400">
                      Reviewed on {new Date(r.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
