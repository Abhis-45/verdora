/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import Layout from "../components/common/layout";
import Head from "next/head";
import Toast from "../components/shared/Toast";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { HeartIcon, ShoppingCartIcon } from "@heroicons/react/24/solid";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { ProductItem } from "@/types/ProductItem";
import ProductMeta from "../components/product/ProductMeta";
import { useRouter } from "next/router";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  return (
    <>
      <Head>
        <title>Wishlist | Verdora</title>
      </Head>
      <Layout>
        <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-4 transition"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Back</span>
          </button>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-6 text-center text-green-900 tracking-tight">
            ♡ Wishlist
          </h1>

          {wishlist.length === 0 ? (
            <div className="text-center mt-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
                Wishlist is empty
              </h2>
              <p className="mt-2 text-gray-500 text-sm">
                Browse products and add your favorites to see them here.
              </p>
              <Link
                href="/products"
                className="mt-4 inline-block px-5 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-500 transition text-sm"
              >
                View All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
              {wishlist.map((product: ProductItem) => (
                <div
                  key={product.id}
                  className="relative rounded-md shadow-md p-2 sm:p-3 hover:shadow-lg transition flex flex-col"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-32 sm:h-36 rounded-md mb-3 overflow-hidden cursor-pointer">
                    <Link href={`/productpage/${product.id}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-md hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                      {product.mrp && (
                        <div className="absolute top-2 left-2">
                          <span className="bg-red-100 text-red-600 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded">
                            {Math.round(
                              ((product.mrp - product.price) / product.mrp) *
                                100,
                            )}
                            % OFF
                          </span>
                        </div>
                      )}
                    </Link>
                    {/* Heart Icon */}
                    <div className="absolute top-2 right-2 group">
                      <button
                        onClick={() => {
                          removeFromWishlist(product.id);
                          setToast({
                            message: `Removed from wishlist`,
                            type: "info",
                          });
                        }}
                        className="text-green-600 hover:text-red-600 transition"
                        aria-label="Remove from Wishlist"
                      >
                        <HeartIcon className="h-5 w-5" />
                      </button>
                      <span className="absolute mt-4 right-0 text-[10px] text-gray-100 bg-black/60 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition">
                        Remove
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="grow">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs sm:text-sm font-semibold text-green-600 truncate">
                        {product.name}
                      </h2>
                      <ProductMeta productId={product.id} />
                    </div>
                    {product.category && (
                      <p className="text-[11px] sm:text-xs text-gray-600">
                        {product.category}
                      </p>
                    )}
                  </div>

                  {/* Price + Cart Button */}
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-green-600 text-xs sm:text-sm">
                        ₹{product.price}
                      </p>
                      {product.mrp && (
                        <p className="text-[11px] sm:text-xs text-gray-500 line-through">
                          ₹{product.mrp}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        addToCart(product);
                        removeFromWishlist(product.id);
                        setToast({
                          message: `${product.name} moved to cart`,
                          type: "success",
                        });
                        router.push("/cart");
                      }}
                      className="w-full flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs bg-green-600 text-white rounded-md hover:bg-green-500 transition"
                      aria-label="Move to Cart"
                    >
                      <ShoppingCartIcon className="h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Move to Cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </Layout>
    </>
  );
}
