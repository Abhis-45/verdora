"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon as HeartOutline,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

interface ProductImageCarouselProps {
  images: { url: string }[];
  productName: string;
  isInWishlist: boolean;
  onToggleWishlist: () => void;
}

export default function ProductImageCarousel({
  images,
  productName,
  isInWishlist,
  onToggleWishlist,
}: ProductImageCarouselProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images]);

  const currentImage = images[selectedImageIndex]?.url;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    } else if (diff < -50) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1,
      );
    }
    setTouchStartX(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="relative group w-full">
      <div
        className="relative h-[320px] sm:h-[480px] lg:h-[560px] w-full overflow-hidden 
                   rounded-2xl border border-transparent 
                   bg-gradient-to-br from-gray-100 to-gray-50 shadow-md 
                   hover:shadow-lg transition"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
      >
        {loading && (
          <div
            className="absolute inset-0 animate-pulse rounded-2xl 
                          bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
          />
        )}

        <Image
          src={currentImage || "/placeholder.png"}
          alt={productName}
          fill
          sizes="(max-width: 1024px) 100vw, 60vw"
          onLoad={() => setLoading(false)}
          className={`h-full w-full object-cover transition-transform duration-300 ${
            loading ? "opacity-0" : "opacity-100"
          } ${zoom ? "lg:scale-125" : "lg:scale-100"}`}
          style={{
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
          }}
        />

        <button
          onClick={onToggleWishlist}
          className="absolute right-4 top-4 rounded-full 
                     bg-white/70 backdrop-blur-sm p-2 shadow-md 
                     transition hover:scale-110 hover:bg-gray-50"
        >
          {isInWishlist ? (
            <HeartSolid className="h-5 w-5 text-red-500" />
          ) : (
            <HeartOutline className="h-5 w-5 text-gray-600 hover:text-red-500" />
          )}
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedImageIndex((prev) =>
                  prev === 0 ? images.length - 1 : prev - 1,
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 
                         rounded-full bg-white/70 backdrop-blur-sm p-2 
                         shadow-md transition hover:scale-110 hover:bg-gray-100"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-900" />
            </button>
            <button
              onClick={() =>
                setSelectedImageIndex((prev) => (prev + 1) % images.length)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 
                         rounded-full bg-white/70 backdrop-blur-sm p-2 
                         shadow-md transition hover:scale-110 hover:bg-gray-100"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-900" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="hidden sm:flex mt-4 gap-3 justify-center">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImageIndex(idx)}
              className={`h-16 w-16 rounded-md overflow-hidden border-2 transition 
                ${idx === selectedImageIndex ? "border-green-600" : "border-transparent hover:border-gray-300"}`}
            >
              <div className="relative h-full w-full">
                <Image
                  src={img.url}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <div className="mt-3 flex sm:hidden justify-center gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImageIndex(idx)}
              className={`h-2 w-2 rounded-full transition-transform ${
                idx === selectedImageIndex
                  ? "bg-green-600 scale-110"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
