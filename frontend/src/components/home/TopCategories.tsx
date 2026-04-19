import { useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import CategoryCard from "./CategoryCard";
import "swiper/css";
import "swiper/css/pagination";

interface CategoryResponse {
  name: string;
  count: number;
  image?: string | null;
}

interface DisplayCategory {
  title: string;
  img: string | null;
  desc: string;
}

export default function TopCategories() {
  const [randomCategories, setRandomCategories] = useState<DisplayCategory[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Fetch timeout")), 15000),
      );

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const fetchPromise = fetch(`${BACKEND_URL}/api/products/featured/categories`);
      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const categoriesData = (await response.json()) as CategoryResponse[];

      // Shuffle and select top categories
      const catCopy = [...categoriesData];
      for (let i = catCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [catCopy[i], catCopy[j]] = [catCopy[j], catCopy[i]];
      }

      const randomCats = catCopy.slice(0, 4).map((cat) => ({
        title: cat.name,
        img: cat.image || null,
        desc: `${cat.count} products in ${cat.name}`,
      }));

      setRandomCategories(randomCats);
    } catch {
      setRandomCategories([]);
    } finally {
      setIsLoading(false);
      setIsHydrated(true);
    }
  };

  if (!isHydrated || randomCategories.length === 0) return null;

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-green-700 flex items-center justify-between">
        Today&apos;s Top Categories
        <Link
          href={`/products`}
          className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base flex gap-1 items-center transition"
        >
          View All
          <ArrowRightCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>
      </h2>

      {isLoading ? (
        <p className="text-center text-gray-500 text-sm">
          Loading categories...
        </p>
      ) : (
        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={1.15}
          spaceBetween={12}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2.5 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className="-mx-4 px-4 custom-swiper"
        >
          {randomCategories.map((c) => (
            <SwiperSlide key={c.title} className="h-auto!">
              <div className="w-full">
                <CategoryCard {...c} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}
