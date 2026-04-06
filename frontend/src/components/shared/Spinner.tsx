/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  color?: "white" | "gray" | "green";
  show?: boolean; // controls fade in/out
};

export default function Spinner({
  size = "md",
  color = "white",
  show = true,
}: SpinnerProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
    } else {
      // delay hiding until fade-out completes
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [show]);

  const sizeClasses =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  const colorClasses =
    color === "white"
      ? "text-white"
      : color === "gray"
        ? "text-gray-500"
        : "text-green-600";

  return (
    visible && (
      <div
        className={`flex justify-center items-center transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      >
        <svg
          className={`animate-spin ${sizeClasses} ${colorClasses}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          {/* Circular spinner */}
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      </div>
    )
  );
}
