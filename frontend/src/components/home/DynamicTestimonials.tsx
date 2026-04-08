/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import TestimonialCard from "./TestimonialCard";

interface Review {
  _id: string;
  comment: string;
  rating: number;
  userName: string;
  productName?: string;
  verified?: boolean;
  createdAt?: string;
}

interface FallbackTestimonial {
  _id: string;
  comment: string;
  rating: number;
  userName: string;
  verified?: boolean;
}

export default function DynamicTestimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback testimonials
  const fallbackReviews: FallbackTestimonial[] = [
    {
      _id: "1",
      comment: "Verdora transformed my balcony into a green paradise!",
      rating: 5,
      userName: "Sarah M.",
      verified: true,
    },
    {
      _id: "2",
      comment: "Healthy plants and great service. Highly recommend.",
      rating: 5,
      userName: "Rajesh K.",
      verified: true,
    },
    {
      _id: "3",
      comment: "Loved the landscaping—professional and creative.",
      rating: 5,
      userName: "Priya S.",
      verified: true,
    },
    {
      _id: "4",
      comment: "The plant care tips really helped my plants thrive.",
      rating: 5,
      userName: "Amit P.",
      verified: true,
    },
    {
      _id: "5",
      comment: "Excellent variety of plants and accessories.",
      rating: 5,
      userName: "Neha D.",
      verified: true,
    },
    {
      _id: "6",
      comment: "Customer support was friendly and knowledgeable.",
      rating: 5,
      userName: "Vikram C.",
      verified: true,
    },
  ];

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviews = async () => {
    try {
      // Fetch trending products first to get product IDs
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const trendingResponse = await fetch(
        `${BACKEND_URL}/api/products/featured/trending?limit=5`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );

      if (!trendingResponse.ok) {
        throw new Error("Failed to fetch trending products");
      }

      const trendingProducts = await trendingResponse.json();
      const productIds = (
        Array.isArray(trendingProducts) ? trendingProducts : []
      )
        .filter((p: any) => p && p._id)
        .map((p: any) => p._id);

      if (productIds.length === 0) {
        setReviews(fallbackReviews);
        setIsLoading(false);
        return;
      }

      // Fetch reviews for these products
      const allReviews: Review[] = [];
      for (const productId of productIds) {
        try {
          const reviewResponse = await fetch(
            `/api/reviews/product/${productId}`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            },
          );

          if (reviewResponse.ok) {
            const productReviews = await reviewResponse.json();
            if (Array.isArray(productReviews) && productReviews.length > 0) {
              allReviews.push(
                ...productReviews.map((review: any) => ({
                  ...review,
                  _id: review._id || Math.random().toString(),
                })),
              );
            }
          }
        } catch (error) {
          console.warn(
            `Error fetching reviews for product ${productId}:`,
            error,
          );
        }
      }

      // Sort by newest and take top 6
      const sortedReviews = allReviews
        .sort(
          (a, b) =>
            new Date(b.createdAt || Date.now()).getTime() -
            new Date(a.createdAt || Date.now()).getTime(),
        )
        .slice(0, 6);

      if (sortedReviews.length > 0) {
        setReviews(sortedReviews);
      } else {
        setReviews(fallbackReviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews(fallbackReviews);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-xl sm:text-xl font-bold mb-4 sm:mb-6 text-green-600">
        What Our Customers Say
      </h2>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-gray-200 h-40 animate-pulse"
              />
            ))}
        </div>
      ) : reviews.length > 0 ? (
        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={1}
          spaceBetween={12}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 3 },
          }}
          className="-mx-4 px-4 custom-swiper"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review._id}>
              <TestimonialCard text={review.comment} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            Be the first to share your experience!
          </p>
        </div>
      )}
    </section>
  );
}
