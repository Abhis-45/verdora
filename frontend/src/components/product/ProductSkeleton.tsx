"use client";

export default function ProductSkeleton() {
  return (
    <div className="rounded-lg shadow-2xl p-3 sm:p-4 flex flex-col">
      {/* Image Skeleton with wave animation */}
      <div className="w-full h-40 sm:h-48 rounded-md mb-4 relative overflow-hidden bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200%_100%] animate-wave"></div>

      {/* Name Skeleton */}
      <div className="h-6 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200%_100%] animate-wave rounded mb-2 w-3/4"></div>

      {/* Category Skeleton */}
      <div className="h-4 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200%_100%] animate-wave rounded w-1/2 mb-4"></div>

      {/* Tags Skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200%_100%] animate-wave rounded-full w-20"></div>
        <div className="h-6 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200%_100%] animate-wave rounded-full w-24"></div>
      </div>

      {/* Price Section Skeleton */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200%_100%] animate-wave rounded w-24"></div>
        <div className="h-6 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200%_100%] animate-wave rounded w-20"></div>
      </div>

      {/* Button Skeleton */}
      <div className="h-10 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-size-[200%_100%] animate-wave rounded-lg w-full mt-auto"></div>
    </div>
  );
}
