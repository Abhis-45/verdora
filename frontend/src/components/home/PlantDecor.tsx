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
          const BACKEND_URL =
            typeof window !== "undefined"
              ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
              : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
          const res = await fetch(`${BACKEND_URL}/api/products?category=Pots%20%26%20Planters&limit=8`);

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
        Plant Decor
        <Link
          href={`/products?category=Pots%20%26%20Planters`}
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
          <div className="">
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
        </>
      )}
    </section>
  );
}
