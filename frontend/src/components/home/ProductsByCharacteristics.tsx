"use client";
import Link from "next/link";

export default function ProductsByCharacteristics() {
  const characteristics = [
    {
      label: "Fragrant",
      tag: "FragrantFlowers",
      symbol: "🌸",
      desc: "Explore our fragrant flowers collection.",
      bg: "bg-gradient-to-br from-pink-100 to-pink-200 hover:from-pink-200 hover:to-pink-300",
    },
    {
      label: "Medicinal",
      tag: "medicinal",
      symbol: "💊",
      desc: "Discover medicinal and healing plants.",
      bg: "bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300",
    },
    {
      label: "Exotic",
      tag: "exotic",
      symbol: "🌍",
      desc: "Browse rare and exotic flowers.",
      bg: "bg-gradient-to-br from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300",
    },
    {
      label: "Long-lasting",
      tag: "long-lasting",
      symbol: "⏳",
      desc: "Find long-lasting blooms for your garden.",
      bg: "bg-gradient-to-br from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300",
    },
  ];

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-green-700">
        Explore by Characteristics
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {characteristics.map((c) => (
          <Link
            key={c.tag}
            href={`/products?tag=${encodeURIComponent(c.tag)}`}
            className={`group rounded-xl shadow-md p-5 flex flex-col items-center text-center transition-transform duration-300 ease-in-out h-36 justify-center ${c.bg} hover:scale-105 hover:shadow-xl`}
          >
            <span className="text-3xl mb-2">{c.symbol}</span>
            <span className="text-green-800 font-semibold">{c.label}</span>
            <p className="text-xs text-gray-700 mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
