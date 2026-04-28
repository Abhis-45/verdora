/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "../../components/common/layout";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useUser } from "../../context/UserContext";
import { useDeliveryLocation } from "@/context/DeliveryLocationContext";
import { useRecentlyViewed } from "@/context/RecentlyViewedContext";
import { ArrowLeftIcon, MapPinIcon } from "@heroicons/react/24/outline";
import RelatedProductsCarousel from "../../components/productpage/RelatedProductsCarousel";
import { PincodeSuggestions } from "../../components/forms/PincodeSuggestions";
import { PincodeData } from "@/utils/pincodeApi";

import {
  calculateDeliveryEstimate,
  isValidPincode,
  resolveDeliveryLocation,
} from "@/utils/delivery";
import {
  buildCartKey,
  getDefaultPlantSize,
  normalizePlantSizes,
  PlantSizeOption,
  PotOption,
} from "@/utils/productOptions";

import ProductImageCarousel from "../../components/productpage/ProductImageCarousel";
import PlantSizeSelector from "../../components/productpage/PlantSizeSelector";
import PotOptionsSelector from "../../components/productpage/PotOptionsSelector";
import TabbedSection from "../../components/productpage/TabbedSection";
import TrustBadges from "../../components/productpage/TrustBadges";
import CartActions from "../../components/productpage/CartActions";
import ProductRating from "@/components/product/ProductRating";
import { ShareIcon } from "@heroicons/react/24/outline";
import { shareProduct } from "@/utils/shareProduct";

type ProductRecord = {
  _id?: string;
  id?: string;
  name: string;
  category?: string;
  vendorName?: string;
  brand?: string;
  image?: string;
  images?: { url: string }[];
  price: number;
  mrp: number;
  description?: string;
  tags?: string[];
  isAvailable?: boolean;
  plantSizes?: PlantSizeOption[];
  originAddress?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
};

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const { deliveryLocation, updateDeliveryLocation } = useDeliveryLocation();
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<PlantSizeOption | null>(
    null,
  );
  const [pincodeInput, setPincodeInput] = useState(deliveryLocation.pincode);
  const [locationEditorOpen, setLocationEditorOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [includePot, setIncludePot] = useState(false);
  const [selectedPotOption, setSelectedPotOption] = useState<PotOption | null>(
    null,
  );

  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const { addViewedProduct } = useRecentlyViewed();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    setPincodeInput(deliveryLocation.pincode);
  }, [deliveryLocation.pincode]);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL ||
              "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL ||
              "https://verdora.onrender.com";
        const response = await fetch(`${BACKEND_URL}/api/products/${id}`);
        if (!response.ok) {
          router.push("/products");
          return;
        }
        const data = await response.json();
        const normalizedProduct = data.product || data;
        normalizedProduct.id =
          normalizedProduct._id || normalizedProduct.id || id;

        // Track viewed product
        addViewedProduct({
          _id: normalizedProduct._id,
          id: normalizedProduct.id,
          name: normalizedProduct.name,
          image: normalizedProduct.image,
          price: normalizedProduct.price,
          mrp: normalizedProduct.mrp,
          category: normalizedProduct.category,
          vendorName: normalizedProduct.vendorName,
          plantSizes: normalizedProduct.plantSizes,
        });
        setProduct(normalizedProduct);
      } catch {
        router.push("/products");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, router, addViewedProduct]);

  const plantSizes = useMemo(
    () =>
      normalizePlantSizes(
        product?.plantSizes,
        product?.price || 0,
        product?.mrp || 0,
      ),
    [product],
  );

  useEffect(() => {
    if (!plantSizes.length) return;
    setSelectedSize((current) => {
      if (current && plantSizes.some((size) => size.id === current.id)) {
        return plantSizes.find((size) => size.id === current.id) || current;
      }
      return getDefaultPlantSize(
        plantSizes,
        product?.price || 0,
        product?.mrp || 0,
      );
    });
  }, [plantSizes, product]);

  // Auto-reset pot selection when selected size doesn't support pot pricing
  useEffect(() => {
    if (selectedSize && (!selectedSize.potPrice || selectedSize.potPrice <= 0)) {
      setIncludePot(false);
      setSelectedPotOption(null);
    }
  }, [selectedSize]);

  useEffect(() => {
    setSelectedPotOption(null);
  }, [selectedSize?.id]);

  if (isLoading || !router.isReady) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!product || !selectedSize) {
    return (
      <Layout>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <p className="text-lg text-gray-600">Product not found</p>
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 font-semibold text-green-600 transition hover:text-green-700"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </Layout>
    );
  }

  const productIdVal = String(product._id || product.id || id);
  const allImages = [
    ...(product.image ? [{ url: product.image }] : []),
    ...(product.images || []).filter((img) => img.url !== product.image),
  ];
  const discount =
    selectedSize.mrp > 0
      ? Math.round(
          ((selectedSize.mrp - selectedSize.price) / selectedSize.mrp) * 100,
        )
      : 0;
  const activePotOption =
    includePot
      ? selectedPotOption ||
        (selectedSize.potPrice && selectedSize.potPrice > 0
          ? {
              name: selectedSize.potName || "Default Pot",
              price: Number(selectedSize.potPrice || 0),
              mrp: Number(selectedSize.potMrp || 0),
              image: selectedSize.potImage || "",
            }
          : null)
      : null;
  const activePotPrice = Number(activePotOption?.price || 0);
  const activePotMrp = Number(activePotOption?.mrp || 0);
  const activePotName = activePotOption?.name || "";

  const cartKey = buildCartKey(
    productIdVal,
    selectedSize.id,
    selectedSize.label,
  );
  const finalCartKey = includePot
    ? `${cartKey}::with-pot::${activePotName || "default"}`
    : cartKey;
  const cartItem = cartItems.find(
    (item) => (item.cartKey || String(item.id)) === finalCartKey,
  );
  const isInWishlist = wishlist.some(
    (entry) =>
      String(entry.id) === productIdVal ||
      String(entry.productId) === productIdVal,
  );

  const activeDeliveryLocation = isValidPincode(pincodeInput)
    ? resolveDeliveryLocation({
        ...deliveryLocation,
        pincode: pincodeInput,
        city: "",
        state: "",
        address: "",
      })
    : deliveryLocation;
  const deliveryEstimate = calculateDeliveryEstimate({
    origin: product.originAddress,
    destination: activeDeliveryLocation,
  });

  const toggleWishlist = () => {
    if (isInWishlist) {
      removeFromWishlist(productIdVal as any);
    } else {
      addToWishlist({
        id: productIdVal,
        productId: productIdVal,
        name: product.name,
        price: selectedSize.price,
        mrp: selectedSize.mrp,
        quantity: 1,
        image: product.image,
        category: product.category,
        tags: product.tags,
      });
    }
  };

  const addCurrentVariantToCart = () => {
    const finalPrice = selectedSize.price + activePotPrice;
    const finalMrp = selectedSize.mrp + activePotMrp;
    const cartKeySuffix = includePot
      ? `::with-pot::${activePotName || "default"}`
      : "";

    addToCart({
      cartKey: `${cartKey}${cartKeySuffix}`,
      id: productIdVal,
      productId: productIdVal,
      name: product.name,
      price: finalPrice,
      mrp: finalMrp,
      quantity: 1,
      image: product.image,
      category: product.category,
      tags: product.tags,
      vendorName: product.vendorName,
      selectedSize,
      selectedPotOption: includePot ? activePotOption : null,
      plantSizes,
      originAddress: product.originAddress,
      deliveryEstimate,
      includePot,
    } as any);
    removeFromWishlist(productIdVal as any);
  };

  const handlePincodeSuggestionSelect = (data: PincodeData) => {
    console.log("[Product Page] Pincode suggestion selected:", data);
    updateDeliveryLocation({
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      address: data.area || data.city,
    });
    setLocationEditorOpen(false);
  };

  const handleShareProduct = async () => {
    await shareProduct({
      productId: String(product?._id || product?.id || id),
      productName: product?.name || "Product",
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
      <Head>
        <title>{product.name} | Verdora</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-linear-to-b from-white via-green-50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-6">
            {/* Back Link */}
            <div className="mb-6">
              <button
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 font-semibold text-green-600 transition hover:text-green-700"
                aria-label="Go back"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Product Images */}
              <div>
                <ProductImageCarousel
                  images={allImages}
                  productName={product.name}
                  isInWishlist={isInWishlist}
                  onToggleWishlist={toggleWishlist}
                />
              </div>

              {/* Right Column: Product Details */}
              <div className="flex flex-col gap-5">
                {/* Unified Product Card */}
                <div className="rounded-lg bg-white/80 backdrop-blur-md shadow-sm p-3 sm:p-4 space-y-3">
                  {/* Product Summary */}
                  <div className="space-y-1">
                    {/* Product Name with Share Button */}
                    <div className="flex items-start justify-between gap-2">
                      <h1 className="relative inline-block text-xl sm:text-xl font-semibold tracking-tight text-green-600 capitalize group flex-1">
                        {product.name}
                        <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-linear-to-r from-green-500 to-green-700 transition-all duration-300 group-hover:w-full"></span>
                      </h1>
                      <button
                        onClick={handleShareProduct}
                        className="flex items-center justify-center p-2 rounded-lg hover:bg-green-100 transition shrink-0"
                        aria-label="Share product"
                        title="Share product"
                      >
                        <ShareIcon className="h-5 w-5 text-green-600 hover:text-green-700" />
                      </button>
                    </div>

                    {/* Share Message */}
                    {shareMessage && (
                      <p className="text-xs text-green-600 font-medium">
                        {shareMessage}
                      </p>
                    )}

                    {/* Rating Below Product Name */}
                    <ProductRating
                      productId={productIdVal}
                      className="text-xs"
                    />

                    <p className="text-sm sm:text-base text-gray-500 capitalize tracking-wide">
                      Vendor : {product.brand || "Verdora"}
                    </p>

                    {/* Stock Status Badge */}
                    <div className="flex items-center gap-2">
                      {product.isAvailable !== false ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm sm:text-base text-gray-700">
                      <span className="text-gray-900">Size:</span>{" "}
                      <span className="text-green-700">
                        {selectedSize.label}
                      </span>
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="text-xl sm:text-xl text-green-700 font-bold">
                        ₹{selectedSize.price + activePotPrice}
                      </span>
                      {includePot && activePotPrice > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                          +₹{activePotPrice} ({activePotName || "pot"})
                        </span>
                      )}
                      {discount > 0 && (
                        <>
                          <span className="text-sm sm:text-base line-through text-red-500">
                            ₹{selectedSize.mrp + activePotMrp}
                          </span>
                          <span className="rounded-full bg-linear-to-r from-red-500 to-red-600 px-2 py-0.5 text-xs sm:text-sm text-white shadow-sm">
                            {discount}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Size Selector */}
                  <PlantSizeSelector
                    sizes={plantSizes}
                    selectedSize={selectedSize}
                    onSelectSize={setSelectedSize}
                  />

                  {/* Pot Options Selector */}
                  <PotOptionsSelector
                    selectedSize={selectedSize}
                    selectedPotOption={selectedPotOption}
                    includePot={includePot}
                    onTogglePot={setIncludePot}
                    onSelectPot={setSelectedPotOption}
                  />

                  <div className="border-t border-gray-200" />

                  {/* Delivery + Trust Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        Delivery
                      </p>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {new Date(
                          deliveryEstimate.estimatedDeliveryDate,
                        ).toLocaleDateString("en-IN", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">
                      From {deliveryEstimate.origin.city},{" "}
                      {deliveryEstimate.origin.state}
                    </p>

                    <div className="flex flex-col gap-3">
                      {/* Pincode Input Section */}
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700">
                          Delivery Location
                        </label>

                        {!locationEditorOpen ? (
                          <button
                            type="button"
                            onClick={() => setLocationEditorOpen(true)}
                            className="w-full text-left rounded-md border border-gray-300 hover:border-green-500 hover:bg-green-50 transition p-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="h-4 w-4 text-green-600 shrink-0" />
                              <div className="min-w-0 flex-1">
                                {deliveryLocation.pincode ? (
                                  <>
                                    <p className="text-xs font-semibold text-gray-700">
                                      {deliveryLocation.city},{" "}
                                      {deliveryLocation.state}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Pincode: {deliveryLocation.pincode}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-xs text-gray-500">
                                    Click to select delivery location
                                  </p>
                                )}
                              </div>
                              <span className="text-green-600 text-sm">
                                {deliveryLocation.pincode ? "Change" : "Select"}
                              </span>
                            </div>
                          </button>
                        ) : (
                          <div className="w-full rounded-md border border-green-200 bg-green-50 p-3 space-y-3">
                            <PincodeSuggestions
                              onSelect={handlePincodeSuggestionSelect}
                              placeholder="Enter 6-digit pincode"
                              className="relative"
                              inputClassName="w-full"
                            />
                            <button
                              type="button"
                              onClick={() => setLocationEditorOpen(false)}
                              className="w-full text-xs font-medium text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-white transition"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">
                          From {deliveryEstimate.origin.city},{" "}
                          {deliveryEstimate.origin.state}
                        </p>
                        <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2.5">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">
                              Estimated Delivery
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(
                                deliveryEstimate.estimatedDeliveryDate,
                              ).toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      <TrustBadges deliveryEstimate={deliveryEstimate} />
                    </div>

                    {/* Divider + Cart Actions for desktop */}
                    <div className="hidden lg:block border-t border-gray-200 pt-3">
                      <CartActions
                        cartItem={cartItem}
                        cartKey={finalCartKey}
                        onAddToCart={addCurrentVariantToCart}
                        onUpdateQuantity={updateQuantity}
                        onRemoveFromCart={removeFromCart}
                        onGoToCart={() => router.push("/cart")}
                        onBuyNow={() => {
                          if (!cartItem) addCurrentVariantToCart();
                          router.push("/cart");
                        }}
                        isAvailable={product.isAvailable !== false}
                      />
                    </div>
                  </div>
                </div>

                {/* Cart Actions for mobile/tablet (sticky bottom bar) */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md p-3 sm:p-4 shadow-lg">
                  <CartActions
                    cartItem={cartItem}
                    cartKey={finalCartKey}
                    onAddToCart={addCurrentVariantToCart}
                    onUpdateQuantity={updateQuantity}
                    onRemoveFromCart={removeFromCart}
                    onGoToCart={() => router.push("/cart")}
                    onBuyNow={() => {
                      if (!cartItem) addCurrentVariantToCart();
                      router.push("/cart");
                    }}
                    isAvailable={product.isAvailable !== false}
                  />
                </div>

                {/* Tabbed Section */}
                <TabbedSection
                  product={product}
                  productIdVal={productIdVal}
                  user={user}
                />
              </div>
            </div>

            {/* Related Products Carousel */}
            <div className="mt-12">
              <RelatedProductsCarousel
                category={product.category}
                productId={productIdVal}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
