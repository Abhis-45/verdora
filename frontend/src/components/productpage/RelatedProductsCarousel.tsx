/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import ProductCard from "../home/ProductCard";
import ProductSkeleton from "../product/ProductSkeleton";

interface RelatedProductsCarouselProps {
  category?: string;
  productId?: string;
}

export default function RelatedProductsCarousel({
  category,
  productId,
}: RelatedProductsCarouselProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!category) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const fetchRelated = async () => {
      try {
        setIsLoading(true);
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const response = await fetch(
          `${BACKEND_URL}/api/products/featured/by-category/${encodeURIComponent(category)}?limit=12`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        const allProducts = Array.isArray(data) ? data : [];
        const filtered = allProducts.filter(
          (p: any) => String(p._id || p.id) !== String(productId),
        );

        if (filtered.length > 0) {
          setProducts(filtered.slice(0, 8));
          setHasError(false);
        } else {
          setHasError(true);
        }
      } catch (err) {
        console.error("Error fetching related products:", err);
        setHasError(true);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelated();
  }, [category, productId]);

  // Don't render if no category or no products found
  if (!category || hasError || products.length === 0) {
    return null;
  }

  if (isLoading || products.length === 0) return null;

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-green-700 flex items-center justify-between">
        Related Products
        <Link
          href={`/products?category=${encodeURIComponent(category || "")}`}
          className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base flex gap-1 items-center transition"
        >
          View All
          <ArrowRightCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
        </div>
      ) : (
        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={1.15}
          spaceBetween={12}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2.3 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className="-mx-4 px-4 custom-swiper"
        >
          {products.map((p: any) => (
            <SwiperSlide key={p._id || p.id}>
              <div className="w-full h-full">
                <ProductCard {...p} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}
