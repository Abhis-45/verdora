/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import ProductCard from "./ProductCard";
import ProductSkeleton from "../product/ProductSkeleton";

export default function TrendingProducts() {
  const [randomProducts, setRandomProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Fetch timeout")), 15000),
      );

      const fetchPromise = fetch(`/api/products/featured/trending?limit=8`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (!response.ok) {
        console.warn(`Trending products fetch failed: ${response.status}`);
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      const productsData = (Array.isArray(data) ? data : data.products || [])
        .filter((p: any) => p && p._id)
        .map((p: any) => ({
          ...p,
          id: p._id || p.id,
        }));

      if (productsData.length > 0) {
        setRandomProducts(productsData.slice(0, 8));
      } else {
        console.warn("No trending products returned from API");
        setRandomProducts([]);
      }
    } catch (error) {
      console.error("Error fetching trending products:", error);
      setRandomProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Hide section if no products available
  if (!isLoading && randomProducts.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-green-700 flex items-center justify-between">
        Today&apos;s Trending Products
        <Link
          href={`/products`}
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
          {randomProducts.map((p: any) => (
            <SwiperSlide key={p.id || p._id}>
              <div className="w-full h-full">
                <ProductCard {...p} _id={p._id} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}
