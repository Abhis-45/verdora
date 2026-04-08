/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { StarIcon, XMarkIcon } from "@heroicons/react/24/solid";
import Toast from "../shared/Toast";
import { uploadImages } from "@/utils/attachments";

interface ReviewSubmitModalProps {
  isOpen: boolean;
  productId: string;
  productName: string;
  productImage?: string;
  orderId?: string;
  orderItemId?: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export default function ReviewSubmitModal({
  isOpen,
  productId,
  productName,
  productImage,
  orderId,
  orderItemId,
  onClose,
  onSubmitSuccess,
}: ReviewSubmitModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleImageSelection = (files: FileList | null) => {
    if (!files) return;

    const selectedFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 4)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setImages(selectedFiles);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      const uploadedImages = await uploadImages({
        files: images.map((image) => image.file),
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
          rating,
          title: title.trim(),
          comment: comment.trim(),
          orderId,
          orderItemId,
          images: uploadedImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      setToast({
        message: "Review submitted successfully!",
        type: "success",
      });

      setTimeout(() => {
        setTitle("");
        setComment("");
        setRating(5);
        setImages([]);
        onSubmitSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      setToast({
        message:
          error instanceof Error ? error.message : "Failed to submit review",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="app-modal-shell" onClick={onClose}>
      <div
        className="app-modal-card w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-xl font-bold text-green-900">Write a Review</h2>
          <button
            onClick={onClose}
            className="text-gray-500 transition hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
          {/* Product Info */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex gap-4">
              {productImage && (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-200">
                  <img
                    src={productImage}
                    alt={productName}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600">Product</p>
                <p className="font-semibold text-gray-900">{productName}</p>
              </div>
            </div>
          </div>

          {/* Rating Selection */}
          <div>
            <label className="block font-semibold text-gray-900 mb-3">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <StarIcon
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block font-semibold text-gray-900 mb-2"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Best quality plant"
              maxLength={50}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
            />
            <p className="mt-1 text-xs text-gray-500">{title.length}/50</p>
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="comment"
              className="block font-semibold text-gray-900 mb-2"
            >
              Your Review
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              maxLength={500}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">{comment.length}/500</p>
          </div>

          <div>
            <label
              htmlFor="review-images"
              className="mb-2 block font-semibold text-gray-900"
            >
              Add Photos
            </label>
            <input
              id="review-images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageSelection(e.target.files)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-green-100 file:px-3 file:py-2 file:font-semibold file:text-green-700"
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload up to 4 images with your review.
            </p>
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={`${image.file.name}-${index}`}
                    className="relative overflow-hidden rounded-xl border border-gray-200"
                  >
                    <img
                      src={image.preview}
                      alt={`Review upload ${index + 1}`}
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages((current) =>
                          current.filter(
                            (_, currentIndex) => currentIndex !== index,
                          ),
                        )
                      }
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-green-600 py-2 font-semibold text-white transition hover:bg-green-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
