"use client";
import Link from "next/link";

interface ProductItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  color?: string;
}

export default function ProductsByColor({
  products = [],
}: {
  products?: ProductItem[];
}) {
  // ✅ Collect unique colors safely
  const allColors = Array.from(
    new Set(products.map((p) => (p.color || "").toLowerCase()).filter(Boolean)),
  );

  // ✅ Priority order
  const priority = ["red", "yellow", "white", "pink"];
  const prioritizedColors = priority.filter((c) => allColors.includes(c));
  const remainingColors = allColors.filter((c) => !priority.includes(c));
  const selectedColors = [...prioritizedColors, ...remainingColors].slice(0, 4);

  // Hide section if no products available
  if (selectedColors.length === 0) {
    return null;
  }

  // ✅ Define styles
  const colorStyles: Record<
    string,
    { bg: string; symbol: string; desc: string }
  > = {
    red: {
      bg: "bg-gradient-to-br from-red-100 to-red-200 hover:from-red-200 hover:to-red-300",
      symbol: "🌹",
      desc: "Passionate red blooms.",
    },
    yellow: {
      bg: "bg-gradient-to-br from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300",
      symbol: "🌻",
      desc: "Bright and cheerful yellow flowers.",
    },
    white: {
      bg: "bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300",
      symbol: "⚪",
      desc: "Elegant and pure white blossoms.",
    },
    pink: {
      bg: "bg-gradient-to-br from-pink-100 to-pink-200 hover:from-pink-200 hover:to-pink-300",
      symbol: "🌸",
      desc: "Soft and charming pink petals.",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300",
      symbol: "💜",
      desc: "Royal and exotic purple flowers.",
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-100 to-orange-200 hover:from-orange-200 hover:to-orange-300",
      symbol: "🍊",
      desc: "Warm and vibrant orange blossoms.",
    },
  };

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-green-700">
        Shop by Flower Color
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {selectedColors.map((color) => {
          const style = colorStyles[color] || {
            bg: "bg-gradient-to-br from-green-100 to-green-200 hover:from-green-200 hover:to-green-300",
            symbol: "🌼",
            desc: `Beautiful ${color} flowers.`,
          };

          return (
            <Link
              key={color}
              href={`/products?color=${encodeURIComponent(color.toLowerCase())}`}
              className={`group rounded-xl shadow-md p-5 flex flex-col items-center text-center transition-transform duration-300 ease-in-out h-36 justify-center ${style.bg} hover:scale-105 hover:shadow-xl`}
            >
              <span className="text-3xl mb-2">{style.symbol}</span>
              <span className="text-green-800 font-semibold capitalize">
                {color}
              </span>
              <p className="text-xs text-gray-700 mt-1">{style.desc}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
