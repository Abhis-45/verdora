/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import "swiper/css";
import "swiper/css/pagination";

interface ProductItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
}

interface PlantCareProps {
  products?: ProductItem[];
}

export default function PlantCareProducts({
  products: initialProducts,
}: PlantCareProps) {
  const [products, setProducts] = useState<ProductItem[]>(
    initialProducts || [],
  );
  const [loading, setLoading] = useState(!initialProducts);

  useEffect(() => {
    if (!initialProducts) {
      async function fetchPlantCare() {
        try {
          const res = await fetch("/api/products/featured/plant-care?limit=8");

          if (!res.ok) {
            throw new Error("Failed to fetch");
          }

          const data = await res.json();
          const normalized = data.map((p: any) => ({
            ...p,
            id: p._id || p.id,
          }));
          setProducts(normalized);
        } catch (err) {
          console.error("Error fetching plant care products:", err);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      }
      fetchPlantCare();
    }
  }, [initialProducts]);

  // ✅ Limit to 8 products
  const visibleProducts = products.slice(0, 8);

  // Hide section if no products available
  if (!loading && visibleProducts.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-green-700 flex items-center justify-between">
        Plant Care Essentials
        <Link
          href={`/products?tag=care`}
          className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base flex gap-1 items-center transition"
        >
          View All
          <ArrowRightCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-48 rounded-lg shimmer" />
            ))}
        </div>
      ) : (
        <>
          {/* Mobile/Tablet Swiper */}
          <div className="block lg:hidden">
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
              {visibleProducts.map((p) => (
                <SwiperSlide key={p.id}>
                  <ProductCard {...p} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop Grid */}
          <div className="hidden lg:grid grid-cols-4 gap-4 sm:gap-5">
            {visibleProducts.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
