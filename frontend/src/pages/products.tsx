"use client";

import Layout from "../components/common/layout";
import Head from "next/head";
import Toast from "../components/shared/Toast";
import ErrorFallback from "../components/shared/ErrorFallback";
import ProductCard from "../components/product/ProductCard";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import ProductSkeleton from "../components/product/ProductSkeleton";
import Breadcrumb from "../components/common/Breadcrumb";

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
  const [showFilters, setShowFilters] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const router = useRouter();
  const {
    category,
    tag: urlTag,
    search,
    color,
    size,
    priceRange,
    filter,
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

        // Discount and sale filters need backend-computed fields/order.
        if (filter && typeof filter === "string") {
          apiUrl = `${BACKEND_URL}/api/products?filter=${encodeURIComponent(filter)}`;
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
  }, [category, color, size, priceRange, urlTag, filter, router.isReady]);

  useEffect(() => {
    if (category && typeof category === "string") {
      setCategoryFilter(category);
      setTagFilter("All Tags");
    } else {
      setCategoryFilter("All Categories");
    }
    if (urlTag && typeof urlTag === "string") {
      setTagFilter(urlTag);
      if (!category) setCategoryFilter("All Categories");
    } else {
      setTagFilter("All Tags");
    }
    if (size && typeof size === "string") {
      setSizeFilter(size);
    } else {
      setSizeFilter("All Sizes");
    }
    if (priceRange && typeof priceRange === "string") {
      const [min, max] = priceRange.split("-");
      const label =
        max === "above"
          ? `â‚¹${min}+`
          : `â‚¹${min} - â‚¹${max}`;
      setPriceRangeFilter(label);
    } else {
      setPriceRangeFilter("All Prices");
    }
    if (search && typeof search === "string") {
      setSearchQuery(search);
    } else {
      setSearchQuery("");
    }
    // Reset pagination when filters change
    setDisplayedCount(PRODUCTS_PER_PAGE);
  }, [category, priceRange, search, size, urlTag]);

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

  const categories = useMemo(
    () => [
      "All Categories",
      ...new Set(products.map((product) => product.category)),
    ],
    [products],
  );
  const productCategories = useMemo(
    () => categories.filter((option) => option !== "All Categories"),
    [categories],
  );

  const handleCategorySelect = (nextCategory: string) => {
    setCategoryFilter(nextCategory);
    setTagFilter("All Tags");
    setDisplayedCount(PRODUCTS_PER_PAGE);

    if (nextCategory === "All Categories") {
      router.push("/products", undefined, { shallow: true });
      return;
    }

    router.push(
      `/products?category=${encodeURIComponent(nextCategory)}`,
      undefined,
      { shallow: true },
    );
  };

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
      const colorMatch =
        !color ||
        typeof color !== "string" ||
        (product.tags || []).some((tag) =>
          tag.toLowerCase().includes(color.toLowerCase()),
        );
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
        categoryMatch &&
        tagMatch &&
        colorMatch &&
        searchMatch &&
        priceMatch &&
        sizeMatch
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
    color,
    products,
    searchQuery,
    sortBy,
    tagFilter,
    sizeFilter,
    priceRangeFilter,
  ]);
  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const loadMoreNode = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && displayedCount < filteredProducts.length) {
          setIsLoadingMore(true);
          // Simulate network delay and then load more products
          setTimeout(() => {
            setDisplayedCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filteredProducts.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreNode) {
      observer.observe(loadMoreNode);
    }

    return () => {
      if (loadMoreNode) {
        observer.unobserve(loadMoreNode);
      }
    };
  }, [displayedCount, filteredProducts.length, isLoadingMore]);
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
            <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1 sm:gap-2 font-semibold text-green-600 transition hover:text-green-700 whitespace-nowrap text-sm sm:text-base"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="text-xs sm:text-sm">
                <Breadcrumb />
              </div>
            </div>

            <div className="mb-8 rounded-3xl bg-linear-to-r from-green-200 to-emerald-400 p-6 text-left sm:mb-10 sm:p-8 sm:text-center lg:mb-12 lg:p-10">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Everything Your Garden Needs
              </h1>
              <p className="mt-3 text-sm text-gray-700 sm:mt-4 sm:text-base">
                Plants, tools, planters and faster delivery estimates right for
                your pincode.
              </p>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => handleCategorySelect("All Categories")}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  categoryFilter === "All Categories"
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-green-200 bg-white text-green-700 hover:border-green-400 hover:bg-green-50"
                }`}
              >
                All
              </button>
              {productCategories.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleCategorySelect(option)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold capitalize transition ${
                    categoryFilter === option
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-green-200 bg-white text-green-700 hover:border-green-400 hover:bg-green-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Compact Filter Controls */}
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex w-full/4 items-center justify-between rounded-md border border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2.5 text-sm font-semibold text-green-700 transition hover:from-green-100 hover:to-emerald-100"
              >
                <span>✨ Filters</span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
              
              {/* Clear Filters Button - Outside Filter Component */}
              {(categoryFilter !== "All Categories" ||
                tagFilter !== "All Tags" ||
                sizeFilter !== "All Sizes" ||
                priceRangeFilter !== "All Prices" ||
                sortBy !== "featured") && (
                <button
                  onClick={clearFilters}
                  className="w-22 h-10 rounded bg-gradient-to-r from-red-400 to-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:from-red-500 hover:to-red-600"
                >
                  ✕ Clear All
                </button>
              )}
              </div>

              {/* Filters Panel */}
              {showFilters && (
                <div className="rounded-md border border-green-300 bg-white p-3 shadow-sm">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {/* Category Filter */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Category
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(event) => {
                          handleCategorySelect(event.target.value);
                        }}
                        className="rounded border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs text-green-700 transition hover:bg-green-100 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                      >
                        {categories.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tag Filter */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Tags
                      </label>
                      <select
                        value={tagFilter}
                        onChange={(event) => {
                          setTagFilter(event.target.value);
                          setDisplayedCount(PRODUCTS_PER_PAGE);
                        }}
                        className="rounded border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs text-green-700 transition hover:bg-green-100 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                      >
                        {availableTags.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Size Filter */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Size
                      </label>
                      <select
                        value={sizeFilter}
                        onChange={(event) => {
                          setSizeFilter(event.target.value);
                          setDisplayedCount(PRODUCTS_PER_PAGE);
                        }}
                        className="rounded border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs text-green-700 transition hover:bg-green-100 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                      >
                        {availableSizes.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range Filter */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Price
                      </label>
                      <select
                        value={priceRangeFilter}
                        onChange={(event) => {
                          setPriceRangeFilter(event.target.value);
                          setDisplayedCount(PRODUCTS_PER_PAGE);
                        }}
                        className="rounded border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs text-green-700 transition hover:bg-green-100 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                      >
                        {availablePriceRanges.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort By */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold uppercase tracking-wide text-green-700">
                        Sort
                      </label>
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        className="rounded border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs text-green-700 transition hover:bg-green-100 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400"
                      >
                        <option value="featured">Featured</option>
                        <option value="price-low">Low to High</option>
                        <option value="price-high">High to Low</option>
                        <option value="name-asc">A to Z</option>
                        <option value="name-desc">Z to A</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="mt-8 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                  {filteredProducts.slice(0, displayedCount).map((product) => {
                    const productId = String(product._id || product.id);
                    const defaultPrice = product.price;
                    const defaultMrp = product.mrp;
                    const discountPercentage = defaultMrp > defaultPrice 
                      ? Math.round(((defaultMrp - defaultPrice) / defaultMrp) * 100)
                      : null;

                    return (
                      <ProductCard
                        key={productId}
                        id={productId}
                        _id={product._id}
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
