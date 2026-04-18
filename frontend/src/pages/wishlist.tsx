/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState } from "react";
import Layout from "../components/common/layout";
import Head from "next/head";
import Toast from "../components/shared/Toast";
import { useWishlist } from "../context/WishlistContext";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { ProductItem } from "@/types/ProductItem";
import { useRouter } from "next/router";
import ProductCard from "../components/home/ProductCard";

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist } = useWishlist();
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 font-semibold text-green-600 transition hover:text-green-700"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="mb-8 rounded-3xl bg-linear-to-r from-green-200 to-emerald-400 p-6 text-left sm:mb-10 sm:p-8 sm:text-center lg:mb-12 lg:p-10">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              ♡ Your Wishlist
            </h1>
            <p className="mt-3 text-sm text-gray-700 sm:mt-4 sm:text-base">
              Items you love and want to keep for later.
            </p>
          </div>

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
            <>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {wishlist.map((product: ProductItem) => {
                  const productId = String(product.id);
                  const defaultPrice = product.price;
                  const defaultMrp = product.mrp;
                  const discountPercentage = defaultMrp && defaultMrp > defaultPrice 
                    ? Math.round(((defaultMrp - defaultPrice) / defaultMrp) * 100)
                    : null;

                  return (
                    <ProductCard
                      key={productId}
                      id={productId}
                      name={product.name}
                      price={defaultPrice}
                      mrp={defaultMrp}
                      image={product.image || ""}
                      category={product.category}
                      tags={product.tags || []}
                      plantSizes={product.plantSizes}
                      quantity={1}
                      discountBadge={discountPercentage ? `${discountPercentage}% OFF` : undefined}
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Layout>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
