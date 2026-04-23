/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  HeartIcon as HeartSolid,
  BoltIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/solid";
import {
  HeartIcon as HeartOutline,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { ProductItem } from "../../types/ProductItem";
import ProductRating from "../product/ProductRating";
import Toast from "../shared/Toast";
import { PlantSizeOption } from "@/utils/productOptions";
import { shareProduct } from "@/utils/shareProduct";

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
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
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

  const handleShareProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    await shareProduct({
      productId: String(productId),
      productName: name,
      onSuccess: (message) => {
        setShareMessage(message);
        setTimeout(() => setShareMessage(""), 2000);
      },
      onError: (error) => {
        console.error("Share error:", error);
      },
    });
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* MOBILE: Horizontal Tile Layout */}
      <div className="md:hidden relative rounded-xl overflow-hidden group hover:shadow-lg transition-shadow duration-300 bg-white flex">
        {/* Image Section - Left Side */}
        <Link
          href={`/productpage/${productId}`}
          className="relative w-32 h-full flex-shrink-0 cursor-pointer group/image overflow-hidden"
        >
          <img
            src={image}
            alt={name}
            className={`w-full h-full object-fill transition-transform duration-700 ease-in-out group-hover/image:scale-105 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />

          {/* Shimmer skeleton */}
          <div
            className={`absolute inset-0 shimmer transition-opacity duration-300 ease-in-out ${
              loaded ? "opacity-0" : "opacity-100"
            }`}
          />
        </Link>

        {/* Discount Badge - Top Left on Image */}
        <div className="absolute top-1 left-1 z-20">
          {discountBadge && (
            <span className="bg-red-50 text-red-600 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
              {discountBadge}
            </span>
          )}
          {!discountBadge && typeof mrp === "number" && (
            <span className="bg-red-50 text-red-600 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
              {Math.round(((mrp - price) / mrp) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Icon - Top Right on Image */}
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
                selectedSize,
                plantSizes,
              });
            }
          }}
          aria-label="Toggle Wishlist"
          className="absolute top-1 left-26 z-20 transition-transform hover:scale-110"
        >
          {isInWishlist ? (
            <HeartSolid className="h-5 w-5 text-green-500" />
          ) : (
            <HeartOutline className="h-5 w-5 text-green-500 hover:text-red-400" />
          )}
        </button>

        {/* Share Icon - Below Wishlist */}
        <button
          onClick={handleShareProduct}
          aria-label="Share Product"
          className="absolute top-1 right-1 z-20 transition-transform hover:scale-110"
          title="Share product"
        >
          <ShareIcon className="h-5 w-5 text-green-500 hover:text-green-700" />
        </button>
        <Link href={`/productpage/${productId}`}>
          {/* Details Section - Right Side */}
          <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between">
            {/* Top Section: Product Info */}
            <div className="space-y-1">
              <h2 className="text-sm capitalize sm:text-sm font-semibold text-green-600 line-clamp-2">
                {name}
              </h2>

              {/* Share Message */}
              {shareMessage && (
                <p className="text-xs text-green-600 font-medium">
                  {shareMessage}
                </p>
              )}

              {/* Category + Rating */}
              <div className="flex items-center gap-1.5 justify-between flex-wrap">
                <p className="text-xs text-gray-600">{category || "Product"}</p>
                <div className="bg-green-100/70 px-1.5 py-0.5 rounded-full">
                  <ProductRating
                    productId={String(productId)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Tags - All tags */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-green-900 px-1.5 py-0.5 rounded text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Size */}
              {selectedSize && (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-gray-700">
                    Size:
                  </span>
                  <span className="text-xs bg-green-100 px-1.5 py-0.5 rounded text-green-700 font-semibold">
                    {selectedSize.label}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Section: Price + Button */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-green-700 text-sm">
                  ₹{selectedSize?.price || price}
                </span>
                {typeof mrp === "number" && mrp > price && (
                  <span className="text-xs text-red-600 line-through">
                    ₹{mrp}
                  </span>
                )}

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (plantSizes && plantSizes.length > 0 && !selectedSize) {
                      setShowSizeModal(true);
                      return;
                    }

                    const cartItem = {
                      id: productId,
                      name,
                      price: selectedSize?.price || price,
                      mrp: selectedSize?.mrp || mrp,
                      image,
                      category,
                      tags,
                      quantity: 1,
                      selectedSize: selectedSize || undefined,
                      plantSizes: plantSizes || undefined,
                    };

                    if (!isAddedToCart) {
                      addToCart(cartItem);
                      setIsAddedToCart(true);
                      setToast({
                        message: `${name} added to cart`,
                        type: "success",
                      });
                    } else {
                      router.push("/cart");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm hover:shadow-md text-xs font-semibold"
                  aria-label={isAddedToCart ? "Go to Cart" : "Add to Cart"}
                >
                  {isAddedToCart ? (
                    <>
                      <BoltIcon className="h-3 w-3" />
                      Buy
                    </>
                  ) : (
                    <>
                      <ShoppingCartIcon className="h-3 w-3" />
                      Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* DESKTOP: Vertical Card Layout */}
      <div className="hidden md:block relative rounded-xl overflow-hidden group h-96 hover:shadow-lg transition-shadow duration-300">
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
            className={`absolute inset-0 shimmer transition-opacity duration-300 ease-in-out ${
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
                selectedSize,
                plantSizes,
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

        {/* Share Icon - Below Wishlist */}
        <button
          onClick={handleShareProduct}
          aria-label="Share Product"
          className="absolute top-12 right-2 z-10 transition-transform hover:scale-110"
          title="Share product"
        >
          <ShareIcon className="h-6 w-6 text-green-500 hover:text-green-700" />
        </button>

        {/* Text + Actions - Bottom Overlay with Transparent Green Background */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white z-10 w-full space-y-2">
          {/* Top Section: Details */}
          <div className="space-y-1.5">
            {/* Line 1: Product Name */}
            <h2 className="text-sm capitalize sm:text-base font-semibold drop-shadow-md line-clamp-1 text-green-400">
              {name}
            </h2>

            {/* Share Message */}
            {shareMessage && (
              <p className="text-xs text-green-200 font-medium">
                {shareMessage}
              </p>
            )}

            {/* Line 2: Category + Rating */}
            <div className="flex items-center gap-2 justify-between ">
              <p className="text-xs text-gray-100 line-clamp-1 flex-1">
                {category || "Product"}
              </p>
              <div className="shrink-0 bg-green-100/70 px-2 py-0.5 rounded-full">
                <ProductRating
                  productId={String(productId)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Line 3: Tags (if available) */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs bg-green-900 px-2 py-0.5 rounded-full text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Line 4: Selected Size or Available Sizes (if available) */}
            {selectedSize && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-100">
                  Size:
                </span>
                <span className="text-xs bg-green-700 px-2 py-0.5 rounded text-white font-semibold">
                  {selectedSize.label}
                </span>
              </div>
            )}
            {!selectedSize && plantSizes && plantSizes.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-semibold text-gray-100">
                  Sizes:
                </span>
                {plantSizes.slice(0, 3).map((size) => (
                  <span
                    key={size.id}
                    className="text-xs bg-green-600 px-1.5 py-0.5 rounded text-white"
                  >
                    {size.label}
                  </span>
                ))}
                {plantSizes.length > 3 && (
                  <span className="text-xs text-gray-200">
                    +{plantSizes.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bottom Section: Price + Single Button */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-green-900 text-sm bg-green-100/70 px-2 py-0.5 rounded-full">
                ₹{selectedSize?.price || price}
              </span>
              {typeof mrp === "number" && mrp > price && (
                <span className="text-sm text-red-600 line-through">
                  ₹{mrp}
                </span>
              )}
            </div>

            {/* Single Toggle Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                if (plantSizes && plantSizes.length > 0 && !selectedSize) {
                  setShowSizeModal(true);
                  return;
                }

                const cartItem = {
                  id: productId,
                  name,
                  price: selectedSize?.price || price,
                  mrp: selectedSize?.mrp || mrp,
                  image,
                  category,
                  tags,
                  quantity: 1,
                  selectedSize: selectedSize || undefined,
                  plantSizes: plantSizes || undefined,
                };

                if (!isAddedToCart) {
                  // First click: Add to cart
                  addToCart(cartItem);
                  setIsAddedToCart(true);
                  setToast({
                    message: `${name} added to cart`,
                    type: "success",
                  });
                } else {
                  // Second click: Redirect to cart
                  router.push("/cart");
                }
              }}
              className="flex items-center justify-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 transition shadow-md hover:shadow-lg text-sm font-semibold whitespace-nowrap"
              aria-label={isAddedToCart ? "Go to Cart" : "Add to Cart"}
              title={isAddedToCart ? "Go to Cart" : "Add to Cart"}
            >
              {isAddedToCart ? (
                <>
                  <BoltIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Buy</span>
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cart</span>
                </>
              )}
            </button>
          </div>
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
    </>
  );
}
