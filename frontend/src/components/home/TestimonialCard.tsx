import { useState } from "react";

type TestimonialCardProps = {
  text: string;
};

export default function TestimonialCard({ text }: TestimonialCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <blockquote
      className="bg-white p-6 transition hover:-translate-y-1 cursor-pointer rounded-md shadow-sm"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Rating Stars */}
      <p className="text-yellow-500">★★★★★</p>

      {/* Testimonial Text */}
      <p
        className={`mt-3 italic text-gray-800 ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        “{text}”
      </p>
    </blockquote>
  );
}
