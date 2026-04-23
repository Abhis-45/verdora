"use client";
import { useSyncExternalStore } from "react";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import ProductCard from "./ProductCard";
import Link from "next/link";
import ArrowRightCircleIcon from "@heroicons/react/24/solid/esm/ArrowRightCircleIcon";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

export default function RecentlyViewedProducts() {
  const { viewedProducts } = useRecentlyViewed();
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!isClient) return null;

  // Hide if no products
  if (!viewedProducts || viewedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 sm:mb-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-green-600">
            Recently Viewed
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Products you&apos;ve been viewing
          </p>
        </div>
        {viewedProducts.length > 0 && (
          <Link
            href={`/products`}
            className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base flex gap-1 items-center transition"
          >
            View All
            <ArrowRightCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>
        )}
      </div>

      {/* Products Swiper */}
      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1.15}
        spaceBetween={12}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        breakpoints={{
            640: { slidesPerView: 2.3 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
        }}
        className="-mx-4 px-4 custom-swiper pb-12"
        style={{
          '--swiper-pagination-bottom': '-10px',
        } as React.CSSProperties}
      >
        {viewedProducts.map((product) => (
          <SwiperSlide key={String(product._id || product.id)}>
            <div className="w-full h-full">
              <ProductCard
                _id={product._id}
                id={product.id || ""}
                name={product.name}
                image={product.image}
                price={product.price}
                mrp={product.mrp}
                category={product.category}
                vendorName={product.vendorName}
                plantSizes={product.plantSizes}
                quantity={1}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
