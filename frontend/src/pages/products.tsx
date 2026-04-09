"use client";

import Layout from "../components/common/layout";
import Head from "next/head";
import Image from "next/image";
import Toast from "../components/shared/Toast";
import ErrorFallback from "../components/shared/ErrorFallback";
import ProductRating from "../components/product/ProductRating";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useDeliveryLocation } from "@/context/DeliveryLocationContext";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import {
  ArrowLeftIcon,
  BoltIcon,
  HeartIcon as HeartOutline,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import ProductSkeleton from "../components/product/ProductSkeleton";
import {
  calculateDeliveryEstimate,
  formatDeliveryDate,
} from "@/utils/delivery";
import {
  buildCartKey,
  getDefaultPlantSize,
  normalizePlantSizes,
} from "@/utils/productOptions";

type PlantSize = {
  id: string;
  label: string;
  price: number;
  mrp: number;
  isDefault?: boolean;
};

type ProductRecord = {
  _id?: string;
  id?: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  image?: string;
  description?: string;
  tags?: string[];
  plantSizes?: PlantSize[];
  originAddress?: Record<string, unknown>;
};

const PRODUCTS_PER_PAGE = 20;
const LOAD_MORE_COUNT = 10;

export default function ProductsPages() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [tagFilter, setTagFilter] = useState("All Tags");
  const [sizeFilter, setSizeFilter] = useState("All Sizes");
  const [priceRangeFilter, setPriceRangeFilter] = useState("All Prices");
  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayedCount, setDisplayedCount] = useState(PRODUCTS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const { addToCart, cartItems } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { deliveryLocation } = useDeliveryLocation();
  const router = useRouter();
  const {
    category,
    tag: urlTag,
    search,
    color,
    size,
    priceRange,
  } = router.query;

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      setDisplayedCount(PRODUCTS_PER_PAGE);

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Network timeout")), 15000),
        );

        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

        let apiUrl = `${BACKEND_URL}/api/products`;

        // Build API URL based on query parameters
        if (category && typeof category === "string") {
          apiUrl = `${BACKEND_URL}/api/products/featured/by-category/${encodeURIComponent(category)}`;
        } else if (color && typeof color === "string") {
          apiUrl = `${BACKEND_URL}/api/products/featured/by-color?color=${encodeURIComponent(color)}`;
        } else if (size && typeof size === "string") {
          apiUrl = `${BACKEND_URL}/api/products/featured/by-size?size=${encodeURIComponent(size)}`;
        } else if (priceRange && typeof priceRange === "string") {
          // Parse price range (e.g., "0-199", "1000-above")
          const rangeParts = (priceRange as string).split("-");
          const minPrice = parseInt(rangeParts[0]) || 0;
          const maxPrice =
            rangeParts[1] === "above"
              ? 100000
              : parseInt(rangeParts[1]) || 10000;
          apiUrl = `${BACKEND_URL}/api/products/featured/by-price?min=${minPrice}&max=${maxPrice}`;
        } else if (urlTag && typeof urlTag === "string") {
          // For tags, use the characteristics endpoint
          apiUrl = `${BACKEND_URL}/api/products/featured/by-characteristics?characteristics=${encodeURIComponent(urlTag)}`;
        }

        const response = (await Promise.race([
          fetch(apiUrl, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }),
          timeoutPromise,
        ])) as Response;

        if (!response.ok) {
          throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        const normalized = (
          Array.isArray(data) ? data : data.products || []
        ).map((product: ProductRecord) => ({
          ...product,
          id: product._id || product.id,
        }));
        setProducts(normalized);
      } catch (fetchError: unknown) {
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : String(fetchError);
        setError(
          errorMessage.includes("timeout")
            ? "The server is taking too long to respond. Please try again."
            : "Unable to load products. Please try again later.",
        );
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (router.isReady) {
      fetchProducts();
    }
  }, [category, color, size, priceRange, urlTag, router.isReady]);

  useEffect(() => {
    if (category && typeof category === "string") {
      setCategoryFilter(category);
      setTagFilter("All Tags");
    }
    if (urlTag && typeof urlTag === "string") {
      setTagFilter(urlTag);
      if (!category) setCategoryFilter("All Categories");
    }
    if (search && typeof search === "string") {
      setSearchQuery(search);
    }
    // Reset pagination when filters change
    setDisplayedCount(PRODUCTS_PER_PAGE);
  }, [category, urlTag, search]);

  // Calculate available sizes
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    const filteredByCategory = products.filter(
      (p) =>
        categoryFilter === "All Categories" || p.category === categoryFilter,
    );
    filteredByCategory.forEach((product) => {
      if (product.plantSizes && Array.isArray(product.plantSizes)) {
        product.plantSizes.forEach((size) => {
          sizes.add(size.label);
        });
      }
    });
    return ["All Sizes", ...Array.from(sizes).sort()];
  }, [products, categoryFilter]);

  // Calculate available price ranges
  const availablePriceRanges = useMemo(() => {
    return [
      "All Prices",
      "₹0 - ₹500",
      "₹501 - ₹1000",
      "₹1001 - ₹2000",
      "₹2001 - ₹5000",
      "₹5001+",
    ];
  }, []);

  // Helper to check if product price falls in range
  const isPriceInRange = (price: number, range: string): boolean => {
    if (range === "All Prices") return true;
    if (range === "₹0 - ₹500") return price >= 0 && price <= 500;
    if (range === "₹501 - ₹1000") return price >= 501 && price <= 1000;
    if (range === "₹1001 - ₹2000") return price >= 1001 && price <= 2000;
    if (range === "₹2001 - ₹5000") return price >= 2001 && price <= 5000;
    if (range === "₹5001+") return price >= 5001;
    return false;
  };

  const categories = useMemo(
    () => [
      "All Categories",
      ...new Set(products.map((product) => product.category)),
    ],
    [products],
  );

  const availableTags = useMemo(
    () =>
      categoryFilter === "All Categories"
        ? [
            "All Tags",
            ...new Set(products.flatMap((product) => product.tags || [])),
          ]
        : [
            "All Tags",
            ...new Set(
              products
                .filter((product) => product.category === categoryFilter)
                .flatMap((product) => product.tags || []),
            ),
          ],
    [categoryFilter, products],
  );

  const filteredProducts = useMemo(() => {
    const isPriceInRangeLocal = (price: number, range: string): boolean => {
      if (range === "All Prices") return true;
      if (range === "₹0 - ₹500") return price >= 0 && price <= 500;
      if (range === "₹501 - ₹1000") return price >= 501 && price <= 1000;
      if (range === "₹1001 - ₹2000") return price >= 1001 && price <= 2000;
      if (range === "₹2001 - ₹5000") return price >= 2001 && price <= 5000;
      if (range === "₹5001+") return price >= 5001;
      return false;
    };

    const nextProducts = products.filter((product) => {
      const categoryMatch =
        categoryFilter === "All Categories" ||
        product.category === categoryFilter;
      const tagMatch =
        tagFilter === "All Tags" || (product.tags || []).includes(tagFilter);
      const searchMatch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      // Check price filter - use the default size price
      const defaultPrice = product.price;
      const priceMatch = isPriceInRangeLocal(defaultPrice, priceRangeFilter);

      // Check size filter
      let sizeMatch = true;
      if (sizeFilter !== "All Sizes" && product.plantSizes) {
        sizeMatch = product.plantSizes.some(
          (size) => size.label === sizeFilter,
        );
      }

      return (
        categoryMatch && tagMatch && searchMatch && priceMatch && sizeMatch
      );
    });

    return [...nextProducts].sort((first, second) => {
      if (sortBy === "price-low") return first.price - second.price;
      if (sortBy === "price-high") return second.price - first.price;
      if (sortBy === "name-asc") return first.name.localeCompare(second.name);
      if (sortBy === "name-desc") return second.name.localeCompare(first.name);
      return 0;
    });
  }, [
    categoryFilter,
    products,
    searchQuery,
    sortBy,
    tagFilter,
    sizeFilter,
    priceRangeFilter,
  ]);

  const clearFilters = () => {
    setCategoryFilter("All Categories");
    setTagFilter("All Tags");
    setSizeFilter("All Sizes");
    setPriceRangeFilter("All Prices");
    setSortBy("featured");
    setDisplayedCount(PRODUCTS_PER_PAGE);
    router.push("/products", undefined, { shallow: true });
  };

  return (
    <>
      <Head>
        <title>Products | Verdora</title>
        <meta
          name="description"
          content="Shop our curated collection of plants, pots, composts, and gardening supplies."
        />
      </Head>

      {error && !isLoading ? (
        <ErrorFallback
          error={error}
          onRetry={() => router.reload()}
          statusCode={500}
        />
      ) : (
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
                Everything Your Garden Needs
              </h1>
              <p className="mt-3 text-sm text-gray-700 sm:mt-4 sm:text-base">
                Plants, tools, planters and faster delivery estimates right for
                your pincode.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 lg:items-center">
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setTagFilter("All Tags");
                  setDisplayedCount(PRODUCTS_PER_PAGE);
                }}
                className="w-full rounded px-3 py-2 text-green-600 border border-green-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 sm:w-auto"
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={tagFilter}
                onChange={(event) => {
                  setTagFilter(event.target.value);
                  setDisplayedCount(PRODUCTS_PER_PAGE);
                }}
                className="w-full rounded px-3 py-2 text-green-600 border border-green-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 sm:w-auto"
              >
                {availableTags.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>

              <select
                value={sizeFilter}
                onChange={(event) => {
                  setSizeFilter(event.target.value);
                  setDisplayedCount(PRODUCTS_PER_PAGE);
                }}
                className="w-full rounded px-3 py-2 text-green-600 border border-green-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 sm:w-auto"
              >
                {availableSizes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={priceRangeFilter}
                onChange={(event) => {
                  setPriceRangeFilter(event.target.value);
                  setDisplayedCount(PRODUCTS_PER_PAGE);
                }}
                className="w-full rounded px-3 py-2 text-green-600 border border-green-300 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 sm:w-auto"
              >
                {availablePriceRanges.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded border border-green-300 bg-white px-3 py-2 text-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 sm:w-auto"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>

              {(categoryFilter !== "All Categories" ||
                tagFilter !== "All Tags" ||
                sizeFilter !== "All Sizes" ||
                priceRangeFilter !== "All Prices" ||
                sortBy !== "featured") && (
                <button
                  onClick={clearFilters}
                  className="w-full rounded bg-linear-to-r from-gray-300 to-gray-400 px-4 py-2 text-black transition hover:scale-105 sm:w-auto"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.slice(0, displayedCount).map((product) => {
                    const productId = String(product._id || product.id);
                    const plantSizes = normalizePlantSizes(
                      product.plantSizes,
                      product.price,
                      product.mrp,
                    );
                    const defaultSize = getDefaultPlantSize(
                      plantSizes,
                      product.price,
                      product.mrp,
                    );
                    const cartKey = buildCartKey(
                      productId,
                      defaultSize.id,
                      defaultSize.label,
                    );
                    const cartItem = cartItems.find(
                      (item) => (item.cartKey || String(item.id)) === cartKey,
                    );
                    const estimate = calculateDeliveryEstimate({
                      origin: product.originAddress,
                      destination: deliveryLocation,
                    });

                    return (
                      <div
                        key={productId}
                        className="flex flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-md transition hover:-translate-y-1 hover:shadow-lg sm:p-4"
                      >
                        <Link href={`/productpage/${productId}`}>
                          <div className="relative mb-3 h-36 w-full overflow-hidden rounded-lg sm:h-40 md:h-44">
                            <Image
                              src={product.image || ""}
                              alt={product.name}
                              fill
                              className="rounded-lg object-cover transition-transform duration-300 hover:scale-105"
                              loading="lazy"
                            />
                            {defaultSize.mrp > defaultSize.price && (
                              <span className="absolute left-2 top-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 shadow-sm sm:text-xs">
                                {Math.round(
                                  ((defaultSize.mrp - defaultSize.price) /
                                    defaultSize.mrp) *
                                    100,
                                )}
                                % OFF
                              </span>
                            )}
                            <div className="absolute right-2 top-2">
                              <button
                                onClick={(event) => {
                                  event.preventDefault();
                                  const exists = wishlist.some(
                                    (entry) => String(entry.id) === productId,
                                  );
                                  if (exists) {
                                    removeFromWishlist(productId);
                                    setToast({
                                      message: "Removed from wishlist",
                                      type: "info",
                                    });
                                  } else {
                                    addToWishlist({
                                      id: productId,
                                      productId,
                                      name: product.name,
                                      price: defaultSize.price,
                                      mrp: defaultSize.mrp,
                                      quantity: 1,
                                      image: product.image,
                                      category: product.category,
                                      tags: product.tags,
                                    });
                                    setToast({
                                      message: "Added to wishlist",
                                      type: "success",
                                    });
                                  }
                                }}
                                className="transition-transform hover:scale-110"
                                aria-label="Toggle Wishlist"
                              >
                                {wishlist.some(
                                  (entry) => String(entry.id) === productId,
                                ) ? (
                                  <HeartSolid className="h-6 w-6 text-green-600 drop-shadow-sm" />
                                ) : (
                                  <HeartOutline className="h-6 w-6 text-green-600 drop-shadow-sm hover:text-red-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </Link>

                        <div className="grow">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <h2 className="capitalize line-clamp-1 text-sm font-semibold text-green-600 sm:text-base">
                              {product.name}
                            </h2>
                          </div>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {product.category}
                            </p>
                            <ProductRating
                              productId={productId}
                              className="text-xs"
                            />
                          </div>
                          <p className="mt-2 text-xs font-medium text-green-700">
                            Delivery by{" "}
                            {formatDeliveryDate(estimate.estimatedDeliveryDate)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {plantSizes.map((size) => (
                              <span
                                key={size.id}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  size.isDefault
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {size.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {(product.tags || []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(product.tags || []).slice(0, 2).map((tag) => (
                              <button
                                key={tag}
                                onClick={() => {
                                  setTagFilter(tag);
                                  setDisplayedCount(PRODUCTS_PER_PAGE);
                                }}
                                className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] text-green-700 transition hover:opacity-80 sm:text-xs"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-green-700 sm:text-base">
                              ₹{defaultSize.price}
                                <span className="text-[10px] text-red-500 sm:text-xs line-through">
                                  ₹{defaultSize.mrp}
                                </span>
                            </p>
                            <p className="text-[10px] text-gray-500 sm:text-xs">
                              {plantSizes.length > 1
                                ? `from ${defaultSize.label}`
                                : "Customizable available"}
                            </p>
                          </div>
                          {cartItem ? (
                            <button
                              onClick={() => router.push("/cart")}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-900 px-2 py-2 text-xs font-medium text-white transition hover:bg-green-700 min-[380px]:w-auto sm:gap-2 sm:px-3 sm:text-sm"
                            >
                              <BoltIcon className="h-4 w-4 shrink-0" />
                              <span className="hidden sm:inline">Buy Now</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                addToCart({
                                  cartKey,
                                  id: productId,
                                  productId,
                                  name: product.name,
                                  price: defaultSize.price,
                                  mrp: defaultSize.mrp,
                                  quantity: 1,
                                  image: product.image,
                                  category: product.category,
                                  tags: product.tags,
                                  selectedSize: defaultSize,
                                  plantSizes,
                                  originAddress: product.originAddress,
                                  deliveryEstimate: estimate,
                                });
                                setToast({
                                  message: `${product.name} added to cart`,
                                  type: "success",
                                });
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-2 py-2 text-xs font-medium text-white transition hover:bg-green-700 min-[380px]:w-auto sm:gap-2 sm:px-3 sm:text-sm"
                            >
                              <ShoppingCartIcon className="h-4 w-4 shrink-0" />
                              <span className="hidden sm:inline">Add to cart</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Infinite scroll trigger */}
                {displayedCount < filteredProducts.length && (
                  <div
                    ref={loadMoreRef}
                    className="mt-8 flex justify-center py-8"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        <p className="text-sm text-gray-600">Loading more...</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Scroll to load more products
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-12 text-center">
                <h2 className="text-2xl font-semibold text-gray-700">
                  No products found
                </h2>
                <p className="mt-2 text-gray-500">
                  Try adjusting your filters or browse all categories
                </p>
              </div>
            )}
          </div>
        </Layout>
      )}

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
