"use client";
import Link from "next/link";

export default function ProductsByPrice() {
  // ✅ Four fixed price range cards
  const ranges = [
    {
      label: "₹0 – ₹199",
      tag: "0-199",
      symbol: "💰",
      desc: "Budget-friendly blooms.",
      bg: "bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300",
    },
    {
      label: "₹200 – ₹499",
      tag: "200-499",
      symbol: "🌿",
      desc: "Affordable premium flowers.",
      bg: "bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300",
    },
    {
      label: "₹500 – ₹999",
      tag: "500-999",
      symbol: "🌺",
      desc: "Elegant mid-range choices.",
      bg: "bg-gradient-to-br from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300",
    },
    {
      label: "₹1000+",
      tag: "1000-above",
      symbol: "🌟",
      desc: "Luxury flowers for special occasions.",
      bg: "bg-gradient-to-br from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300",
    },
  ];

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-green-700">
        Shop by Price Range
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {ranges.map((r) => (
          <Link
            key={r.tag}
            href={`/products?priceRange=${encodeURIComponent(r.tag)}`}
            className={`group rounded-xl shadow-md p-5 flex flex-col items-center text-center transition-transform duration-300 ease-in-out h-36 justify-center ${r.bg} hover:scale-105 hover:shadow-xl`}
          >
            <span className="text-3xl mb-2">{r.symbol}</span>
            <span className="text-green-800 font-semibold">{r.label}</span>
            <p className="text-xs text-gray-700 mt-1">{r.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
