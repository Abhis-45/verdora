"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function SearchBar({ mobile = false }: { mobile?: boolean }) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <>
      <title>Search Products | Verdora</title>
      <form
        onSubmit={handleSearch}
        className={`flex items-center ${mobile ? "w-full" : ""}`}
      >
        <div className={`relative ${mobile ? "w-full" : ""}`}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-4 py-2 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400 ${
              mobile ? "w-full" : "w-130"
            }`}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-green-600 transition"
            aria-label="Search"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </>
  );
}
