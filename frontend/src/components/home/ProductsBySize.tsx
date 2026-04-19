"use client";
import Link from "next/link";

export default function ProductsBySize() {
  const sizes = ["S", "M", "L", "XL"];

  // ✅ Distinct icons and descriptions per size
  const sizeInfo: Record<string, { icon: string; desc: string; bg: string }> = {
    S: {
      icon: "🌱",
      desc: "Compact plants for small spaces.",
      bg: "bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300",
    },
    M: {
      icon: "🌿",
      desc: "Medium growth, versatile choice.",
      bg: "bg-gradient-to-br from-emerald-100 to-emerald-200 hover:from-emerald-200 hover:to-emerald-300",
    },
    L: {
      icon: "🌳",
      desc: "Large decorative plants for impact.",
      bg: "bg-gradient-to-br from-teal-100 to-teal-200 hover:from-teal-200 hover:to-teal-300",
    },
    XL: {
      icon: "🌲",
      desc: "Extra tall plants for statement decor.",
      bg: "bg-gradient-to-br from-cyan-100 to-cyan-200 hover:from-cyan-200 hover:to-cyan-300",
    },
  };

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-green-700">
        Shop by Plant Size
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {sizes.map((size) => {
          const { icon, desc, bg } = sizeInfo[size];

          return (
            <Link
              key={size}
              href={`/products?size=${size}`}
              className={`group rounded-xl shadow-md p-5 flex flex-col items-center text-center transition-transform duration-300 ease-in-out h-44 justify-center ${bg} hover:scale-105 hover:shadow-xl`}
            >
              <span className="text-2xl mb-2">{icon}</span>
              <span className="text-green-800 font-semibold">{size}</span>
              <p className="text-xs text-gray-700 mt-1">{desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
