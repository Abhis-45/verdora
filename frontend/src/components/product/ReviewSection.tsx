/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import Toast from "../shared/Toast";
import { uploadImages, UploadedImage } from "@/utils/attachments";

interface Review {
  _id: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  images?: UploadedImage[];
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

interface ReviewSectionProps {
  productId: string;
  isUserLoggedIn: boolean;
  userOrders: any[];
  hasPurchased?: boolean;
}

export default function ReviewSection({
  productId,
  isUserLoggedIn,
  userOrders,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [eligibleOrders, setEligibleOrders] = useState<any[]>(userOrders || []);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [reviewImages, setReviewImages] = useState<
    { file: File; preview: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getEligibleReviewTarget = () => {
    if (!isUserLoggedIn) return null;

    for (const order of eligibleOrders || []) {
      for (const item of order?.items || []) {
        const isCurrentProduct =
          String(item?.id || item?.productId || "") === String(productId);
        const isDelivered = (item?.status || order?.status) === "delivered";
        const alreadyReviewed = Boolean(item?.reviewSubmitted);

        if (isCurrentProduct && isDelivered && !alreadyReviewed) {
          return {
            orderId: order?._id || order?.id,
            orderItemId: item?._id || item?.itemId,
          };
        }
      }
    }

    return null;
  };

  const reviewTarget = getEligibleReviewTarget();

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [productId]);

  useEffect(() => {
    setEligibleOrders(userOrders || []);
  }, [userOrders]);

  useEffect(() => {
    if (!isUserLoggedIn) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchOrders = async () => {
      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const response = await fetch(`${BACKEND_URL}/api/profile/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;
        const data = await response.json();
        setEligibleOrders(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.orders)
              ? data.orders
              : [],
        );
      } catch {
        // Keep fallback order data from props when refresh fails.
      }
    };

    fetchOrders();
  }, [isUserLoggedIn]);

  const fetchReviews = async () => {
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/reviews/product/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      // Silently fail - don't show error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/reviews/product/${productId}/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      // Silently fail - don't show error
    }
  };

  const canReview = () => {
    return Boolean(reviewTarget);
  };

  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      const uploadedImages = await uploadImages({
        files: reviewImages.map((image) => image.file),
        token,
        endpoint: "https://verdora.onrender.com/api/reviews/upload-images",
      });

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          rating: formData.rating,
          title: formData.title,
          comment: formData.comment,
          orderId: reviewTarget?.orderId,
          orderItemId: reviewTarget?.orderItemId,
          images: uploadedImages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific errors
        if (response.status === 401) {
          localStorage.removeItem("userToken");
          throw new Error("Session expired. Please login again.");
        }
        if (response.status === 403) {
          throw new Error(
            data.message ||
              "You must purchase this product first to leave a review.",
          );
        }
        throw new Error(data.message || "Failed to add review");
      }

      setToast({
        message: "Review added successfully!",
        type: "success",
      });

      setFormData({ rating: 5, title: "", comment: "" });
      setReviewImages([]);
      setShowReviewForm(false);
      fetchReviews();
      fetchStats();
      setEligibleOrders((current) =>
        current.map((order: any) => ({
          ...order,
          items: (order?.items || []).map((item: any) =>
            String(order?._id || order?.id) === String(reviewTarget?.orderId) &&
            String(item?._id || item?.itemId) ===
              String(reviewTarget?.orderItemId)
              ? { ...item, reviewSubmitted: true, canReview: false }
              : item,
          ),
        })),
      );
    } catch (err: any) {
      setToast({
        message: (err && err.message) || "Failed to add review",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelection = (files: FileList | null) => {
    if (!files) return;

    const nextImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 4)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setReviewImages(nextImages);
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-600">Loading reviews...</div>
    );
  }

  return (
    <section className="py-8 border-t">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>

      {/* Rating Summary */}
      {stats && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <div className="text-4xl font-bold text-gray-900">
                {stats.averageRating}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(stats.averageRating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Based on {stats.totalReviews} review
                {stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="ml-auto space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-12">{rating} ★</span>
                  <div className="w-32 h-2 bg-gray-200 rounded">
                    <div
                      className="h-full bg-yellow-400 rounded"
                      style={{
                        width: `${
                          stats.totalReviews > 0
                            ? ((stats.ratingDistribution[rating] || 0) /
                                stats.totalReviews) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {stats.ratingDistribution[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Add Review Button */}
          {canReview() ? (
            !showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Write a Review
              </button>
            ) : (
              <form
                onSubmit={handleSubmitReview}
                className="mt-6 p-4 bg-white rounded-lg border"
              >
                <h3 className="font-bold mb-4">Share Your Experience</h3>

                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, rating }))
                        }
                        className="focus:outline-none"
                      >
                        <StarIcon
                          className={`w-8 h-8 cursor-pointer transition ${
                            rating <= formData.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-4">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Review Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Beautiful and healthy"
                  />
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your Review
                  </label>
                  <textarea
                    id="comment"
                    value={formData.comment}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        comment: e.target.value,
                      }))
                    }
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Tell us about your experience..."
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="review-images-inline"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Add Photos
                  </label>
                  <input
                    id="review-images-inline"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageSelection(e.target.files)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-green-100 file:px-3 file:py-2 file:font-semibold file:text-green-700"
                  />
                  {reviewImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {reviewImages.map((image, index) => (
                        <div
                          key={`${image.file.name}-${index}`}
                          className="overflow-hidden rounded-xl border border-gray-200"
                        >
                          <img
                            src={image.preview}
                            alt={`Review image ${index + 1}`}
                            className="h-24 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewImages([]);
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )
          ) : isUserLoggedIn ? (
            <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-yellow-800 text-sm font-medium">
              💡{" "}
              <span className="ml-2">
                Buy this product to share your review - Verified buyers only
              </span>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg text-blue-800 text-sm font-medium">
              📝{" "}
              <span className="ml-2">
                Sign in and purchase to leave your review
              </span>
            </div>
          )}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="border-b pb-6 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {review.userName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {review.title}
              </h4>
              <p className="text-gray-700">{review.comment}</p>
              {review.images && review.images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {review.images.map((image, index) => (
                    <div
                      key={`${review._id}-${index}`}
                      className="overflow-hidden rounded-xl border border-gray-200"
                    >
                      <img
                        src={image.url}
                        alt={`Review attachment ${index + 1}`}
                        className="h-24 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
