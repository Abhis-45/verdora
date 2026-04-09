/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { HeartIcon as HeartSolid, BoltIcon } from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { ProductItem } from "../../types/ProductItem";
import ProductRating from "../product/ProductRating";
import Toast from "../shared/Toast";
import { PlantSizeOption } from "@/utils/productOptions";

type ProductCardProps = ProductItem & { _id?: string; discountBadge?: string };

export default function ProductCard({
  id,
  _id,
  name,
  price,
  mrp,
  image,
  category,
  tags,
  plantSizes,
  discountBadge,
}: ProductCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<PlantSizeOption | null>(
    plantSizes && plantSizes.length > 0 ? plantSizes[0] : null,
  );
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const router = useRouter();
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  // Use _id (MongoDB ObjectId) for routing, fallback to id
  const productId = _id || id;
  const isInWishlist = wishlist.some(
    (p) =>
      String(p.id) === String(productId) ||
      String(p.productId) === String(productId),
  );

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="relative rounded-xl overflow-hidden group h-80 hover:shadow-lg transition-shadow duration-300">
        {/* Clickable Image Link Area */}
        <Link
          href={`/productpage/${productId}`}
          className="absolute inset-0 z-0 cursor-pointer"
        >
          {/* Background Image */}
          <img
            src={image}
            alt={name}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 cursor-pointer ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />

          {/* Shimmer skeleton */}
          <div
            className={`absolute inset-0 shimmer transition-opacity duration-700 ease-in-out ${
              loaded ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
        </Link>

        {/* Discount Badge */}
        {discountBadge && (
          <span className="absolute top-2 left-2 bg-red-50 text-red-600 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full z-10">
            {discountBadge}
          </span>
        )}
        {!discountBadge && typeof mrp === "number" && (
          <span className="absolute top-2 left-2 bg-red-50 text-red-600 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full z-10">
            {Math.round(((mrp - price) / mrp) * 100)}% OFF
          </span>
        )}

        {/* Wishlist Icon */}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (isInWishlist) {
              removeFromWishlist(productId);
            } else {
              addToWishlist({
                id: productId,
                name,
                price,
                mrp,
                image,
                category,
                tags,
                quantity: 1,
              });
            }
          }}
          aria-label="Toggle Wishlist"
          className="absolute top-2 right-2 z-10 transition-transform hover:scale-110"
        >
          {isInWishlist ? (
            <HeartSolid className="h-6 w-6 text-green-500" />
          ) : (
            <HeartOutline className="h-6 w-6 text-green-500 hover:text-red-400" />
          )}
        </button>

        {/* Text + Actions - Clean 3-Line Layout */}
        <div className="absolute bottom-0 left-0 p-3 sm:p-4 text-white z-10 w-full space-y-1.5">
          {/* Line 1: Product Name */}
          <h2 className="text-sm sm:text-base font-semibold drop-shadow-md line-clamp-1 text-green-400">
            {name}
          </h2>

          {/* Line 2: Category + Rating (Same Line) */}
          <div className="flex items-center gap-2 justify-between">
            <p className="text-xs text-gray-300 line-clamp-1 flex-1">
              {category || "Product"}
            </p>
            <div className="shrink-0">
              <ProductRating
                productId={String(productId)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Line 3: Price + Buy Now Button (Same Line) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-green-300 text-sm">₹{price}</span>
              {typeof mrp === "number" && mrp > price && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{mrp}
                </span>
              )}
            </div>

            {/* Buy Now Button */}
            <button
              onClick={() => {
                if (plantSizes && plantSizes.length > 0 && !selectedSize) {
                  setShowSizeModal(true);
                  return;
                }

                const cartItem = {
                  id: productId,
                  name,
                  price,
                  mrp,
                  image,
                  category,
                  tags,
                  quantity: 1,
                  selectedSize: selectedSize || undefined,
                  plantSizes: plantSizes || undefined,
                };

                addToCart(cartItem);
                setToast({
                  message: `${name} added to cart`,
                  type: "success",
                });
                setTimeout(() => {
                  router.push("/cart");
                }, 1000);
              }}
              className="flex items-center justify-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition shadow-md hover:shadow-lg text-xs font-semibold whitespace-nowrap"
              aria-label="Add to Cart"
              title="Buy Now"
            >
              <BoltIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Buy</span>
            </button>
          </div>
        </div>

        {/* Size Selection Modal - if needed */}
        {showSizeModal && plantSizes && plantSizes.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowSizeModal(false)}
          >
            <div
              className="bg-white rounded-lg p-6 w-96 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-gray-900">
                Select Size
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {plantSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedSize(size);
                      setShowSizeModal(false);
                    }}
                    className={`p-3 border-2 rounded-lg transition-all text-sm font-medium ${
                      selectedSize?.id === size.id
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div>{size.label}</div>
                    <div className="text-xs text-gray-600">₹{size.price}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowSizeModal(false);
                  const cartItem = {
                    id: productId,
                    name,
                    price,
                    mrp,
                    image,
                    category,
                    tags,
                    quantity: 1,
                    selectedSize: selectedSize || undefined,
                    plantSizes: plantSizes || undefined,
                  };
                  addToCart(cartItem);
                }}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
