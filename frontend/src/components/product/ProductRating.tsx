"use client";
import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

interface ProductRatingProps {
  productId: string;
  className?: string;
  showDetails?: boolean;
}

export default function ProductRating({
  productId,
  className = "",
  showDetails = false,
}: ProductRatingProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/reviews/product/${productId}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch review stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [productId]);

  if (isLoading || !stats || stats.totalReviews === 0) {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-green-800 ${className}`}
      >
        <span className="flex items-center gap-1 font-semibold">
          <StarIcon className="h-4 w-4 text-green-500" />
          <span>| New rating</span>
        </span>
        {showDetails && (
          <span className="text-xs text-gray-500">0 ratings</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm font-semibold text-green-700">
        <StarIcon className="h-4 w-4 fill-green-500 text-green-500" />
        <span>| {stats.averageRating} rating</span>
      </div>
      <span className="text-xs text-gray-600">
        {stats.totalReviews} {stats.totalReviews === 1 ? "rating" : "ratings"}
      </span>
    </div>
  );
}
