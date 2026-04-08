"use client";
import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";

export default function ProductMeta({
  productId,
}: {
  productId: string | number;
}) {
  const [purchased, setPurchased] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const BACKEND_URL =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
        : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
    fetch(`${BACKEND_URL}/api/products/${productId}/stats`, {})
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return;
        setPurchased(d.purchased ?? 0);
      })
      .catch(() => {
        if (!mounted) return;
        setPurchased(0);
      });
    return () => {
      mounted = false;
    };
  }, [productId]);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <StarIcon className="w-4 h-4 text-green-600" />
      {purchased !== null && purchased > 0 && (
        <span className="text-green-600">({purchased})</span>
      )}
    </div>
  );
}
