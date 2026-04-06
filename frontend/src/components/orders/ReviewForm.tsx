/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";

export default function ReviewForm({
  productId,
  onSubmit,
}: {
  productId: string;
  onSubmit: (review: any) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!rating || !comment.trim()) return;
    onSubmit({ productId, rating, comment, date: new Date().toISOString() });
    setRating(0);
    setComment("");
  };

  return (
    <div className="mt-2 p-3 border rounded-lg bg-gray-50">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-xl ${star <= rating ? "text-yellow-500" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review..."
        className="w-full border rounded p-2 text-sm"
      />
      <button
        onClick={handleSubmit}
        className="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
      >
        Submit Review
      </button>
    </div>
  );
}
