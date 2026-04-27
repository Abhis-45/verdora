/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import ProductCard from "./ProductCard";
import ProductSkeleton from "../product/ProductSkeleton";

interface DiscountProduct {
  _id: string;
  id: string;
  name: string;
  price: number;
  mrp?: number;
  originalPrice?: number;
  discountPercentage?: number;
  image: string;
  [key: string]: any;
}

const getDiscountPercentage = (product: DiscountProduct) => {
  const mrp = Number(product.mrp);
  const price = Number(product.price);

  if (Number.isFinite(mrp) && Number.isFinite(price) && mrp > 0) {
    return ((mrp - price) / mrp) * 100;
  }

  if (
    typeof product.discountPercentage === "number" &&
    Number.isFinite(product.discountPercentage)
  ) {
    return product.discountPercentage;
  }

  return 0;
};

export default function DiscountSaleProducts() {
  const [discountProducts, setDiscountProducts] = useState<DiscountProduct[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasProducts, setHasProducts] = useState(false);

  useEffect(() => {
    fetchDiscountProducts();
  }, []);

  const fetchDiscountProducts = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Fetch timeout")), 15000),
      );

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const discountFilter = encodeURIComponent("discountPercentage>50");
      const fetchPromise = fetch(`${BACKEND_URL}/api/products?filter=${discountFilter}&limit=8`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (!response.ok) {
        setDiscountProducts([]);
        setHasProducts(false);
      } else {
        const data = await response.json();
        const productsData = (Array.isArray(data) ? data : data.products || [])
          .filter((p: any) => p && p._id)
          .map((p: any) => ({
            ...p,
            id: p._id || p.id,
            discountSortValue: getDiscountPercentage(p),
          }))
          .filter((p: any) => p.discountSortValue > 50)
          .sort(
            (a: any, b: any) => b.discountSortValue - a.discountSortValue,
          )
          .map((p: any) => ({
            ...p,
            discountPercentage: Math.round(p.discountSortValue),
          }));

        if (productsData.length > 0) {
          setDiscountProducts(productsData.slice(0, 8));
          setHasProducts(true);
        } else {
          setDiscountProducts([]);
          setHasProducts(false);
        }
      }
    } catch {
      setDiscountProducts([]);
      setHasProducts(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Only render if products are available
  if (!isLoading && !hasProducts) {
    return null;
  }

  return (
    <section className="mb-8 sm:mb-10 bg-linear-to-r from-red-50 to-orange-50 rounded-lg p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-red-700 flex items-center justify-between">
        🔥 Summer Sale
        <Link
          href={`/products?filter=${encodeURIComponent("discountPercentage>50")}`}
          className="text-red-600 hover:text-red-700 font-medium text-sm sm:text-base flex gap-1 items-center transition"
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
          {discountProducts.map((p: any) => (
            <SwiperSlide key={p.id || p._id}>
              <div className="w-full h-full">
                <ProductCard
                  {...p}
                  _id={p._id}
                  discountBadge={
                    p.discountPercentage ? `${p.discountPercentage}% OFF` : null
                  }
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}
