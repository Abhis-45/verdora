"use client";

import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import "../../app/globals.css";
import {
  ShoppingCartIcon,
  HeartIcon,
  UserCircleIcon,
  UserIcon,
  ClockIcon,
  ArrowLeftOnRectangleIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import AuthPopup from "../auth/AuthPop";
import CategoryDropdown from "../forms/CategoryDropdown";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useUser } from "../../context/UserContext";
import { CartItem } from "@/types/types";
import SearchBar from "../forms/SearchBar";
import { DEFAULT_DELIVERY_LOCATION } from "@/utils/delivery";
import { useDeliveryLocation } from "../../context/DeliveryLocationContext";
import { PincodeSuggestions } from "../forms/PincodeSuggestions";
import { PincodeData } from "@/utils/pincodeApi";

export default function Header() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [locationEditorOpen, setLocationEditorOpen] = useState(false);
  const { user, logout } = useUser();
  const { deliveryLocation, updateDeliveryLocation } = useDeliveryLocation();
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();

  const itemCount = cartItems.reduce(
    (sum: number, item: CartItem) => sum + item.quantity,
    0,
  );
  const wishlistCount = wishlist.length;

  // Only show delivery location if it's been explicitly set (not the default)
  const isLocationExplicitlySet =
    deliveryLocation.pincode !== DEFAULT_DELIVERY_LOCATION.pincode;

  const primaryLocationLine = isLocationExplicitlySet
    ? deliveryLocation.address || `${deliveryLocation.city}`
    : "Select delivery location";

  const secondaryLocationLine = isLocationExplicitlySet
    ? `${deliveryLocation.city}, ${deliveryLocation.state} ${deliveryLocation.pincode}`
    : "Enter pincode to find area";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setDropdownOpen(false);
    logout();
    router.push("/");
  };

  const handlePincodeSuggestionSelect = (data: PincodeData) => {
    console.log("Header: Pincode suggestion selected:", data);
    updateDeliveryLocation({
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      address: data.area || data.city,
    });
    setLocationEditorOpen(false);
  };

  const renderLocationCard = () => (
    <div className="relative w-full">
      <button
        onClick={() => {
          setLocationEditorOpen((current) => !current);
        }}
        className="flex w-full items-center gap-2 rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/20 bg-white/10 px-2 sm:px-2.5 py-1.5 sm:py-2 lg:py-2.5 text-left text-white transition hover:bg-white/20"
      >
        <MapPinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 shrink-0 text-emerald-100" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] sm:text-xs lg:text-sm font-semibold leading-3 sm:leading-4 lg:leading-5">
            {primaryLocationLine}
          </p>
          <p className="truncate text-[9px] sm:text-[10px] lg:text-xs leading-2 sm:leading-3 lg:leading-4 text-emerald-50">
            {secondaryLocationLine}
          </p>
        </div>
      </button>

      {locationEditorOpen && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-[50vh] sm:max-h-[60vh] lg:max-h-[75vh] w-full overflow-y-auto rounded-lg lg:rounded-2xl border border-green-100 bg-white p-2 sm:p-3 lg:p-4 text-gray-900 shadow-2xl md:left-auto md:right-0 md:w-80">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-[11px] sm:text-xs lg:text-sm font-semibold text-green-900">
                Delivery pincode
              </p>
              <p className="mt-0.5 text-[10px] sm:text-[11px] lg:text-xs text-gray-500">
                Enter 6-digit pincode
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-green-50 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] lg:text-[11px] font-semibold text-green-700">
              {deliveryLocation.pincode}
            </span>
          </div>
          <div className="mt-2 sm:mt-3">
            <PincodeSuggestions
              onSelect={handlePincodeSuggestionSelect}
              placeholder="Enter 6-digit pincode"
              className="relative"
              inputClassName="w-full text-xs sm:text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-green-600 shadow-md">
      <div className="mx-auto w-full max-w-full px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Desktop & Tablet: Single Row (md and up) */}
        <div className="hidden md:flex w-full items-center gap-1 py-2.5 md:py-2.5 lg:py-3">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logos.png"
              alt="Verdora Logo"
              width={100}
              height={60}
              className="h-auto w-16 md:w-16 lg:w-20"
            />
          </Link>

          {/* Category Dropdown - md+ */}
          <div className="flex-shrink-0">
            <CategoryDropdown
              onToggle={() => setBrowseOpen(!browseOpen)}
              isOpen={browseOpen}
            />
          </div>

          {/* Search Bar - Flexible, fills space */}
          <div className="min-w-0 flex-1">
            <SearchBar mobile={false} />
          </div>

          {/* Location Card - Visible md-lg */}
          <div className="hidden flex-shrink-0 md:block lg:hidden">
            {renderLocationCard()}
          </div>

          {/* Location Card - Visible lg+ */}
          <div className="hidden flex-shrink-0 lg:block">
            {renderLocationCard()}
          </div>

          {/* Right Icons Container */}
          <div className="flex flex-shrink-0 items-center gap-1">
            {/* Wishlist Icon */}
            <Link href="/wishlist" className="relative inline-flex items-center justify-center rounded-lg p-1.5 transition hover:bg-white/10">
              <HeartIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6 text-white transition hover:text-pink-400" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link href="/cart" className="relative inline-flex items-center justify-center rounded-lg p-1.5 transition hover:bg-white/10">
              <ShoppingCartIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-6 lg:w-6 text-white transition hover:text-green-900" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative">
              {user ? (
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg p-1.5 text-white transition hover:bg-white/10 hover:text-green-100"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <UserCircleIcon className="h-6 w-6 md:h-6 md:w-6 lg:h-6 lg:w-6" />
                  <span className="hidden text-sm lg:inline font-medium truncate max-w-[80px]">
                    {user.name || "Hi"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-lg p-1.5 text-white transition hover:bg-white/10 hover:text-green-100"
                  onClick={() => setShowAuth(true)}
                >
                  <UserCircleIcon className="h-6 w-6 md:h-6 md:w-6 lg:h-6 lg:w-6" />
                  <span className="hidden text-sm lg:inline">Login</span>
                </button>
              )}

              {user && dropdownOpen && (
                <div className="absolute right-0 z-70 mt-2 w-48 md:w-56 rounded-lg border border-gray-200 bg-white text-black shadow-xl">
                  <div className="border-b border-gray-200 bg-gray-50 px-3 md:px-4 py-2 md:py-3">
                    <p className="truncate text-xs md:text-sm font-semibold text-gray-800">
                      {user.name || "Hi"}
                    </p>
                    <p className="truncate text-[10px] md:text-xs text-gray-500">
                      {user.email || user.mobile}
                    </p>
                  </div>
                  <ul className="py-1 md:py-2">
                    <li
                      className="flex cursor-pointer items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-gray-700 transition hover:bg-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <UserIcon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 text-blue-600" />
                      <span>My Profile</span>
                    </li>
                    <li
                      className="flex cursor-pointer items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-gray-700 transition hover:bg-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/orders");
                      }}
                    >
                      <ClockIcon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0 text-orange-600" />
                      <span>Order History</span>
                    </li>
                    <li className="border-t border-gray-200"></li>
                    <li
                      className="flex cursor-pointer items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-red-600 transition hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <ArrowLeftOnRectangleIcon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                      <span>Logout</span>
                    </li>
                  </ul>
                </div>
              )}

              {showAuth && (
                <AuthPopup
                  onClose={() => setShowAuth(false)}
                  onLogin={() => setShowAuth(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Two Rows (below md) */}
        <div className="flex md:hidden w-full flex-col gap-2 py-2 sm:gap-2.5 sm:py-2.5">
          {/* Row 1: Logo + Icons */}
          <div className="flex w-full items-center justify-between gap-2 sm:gap-3">
            <Link href="/" className="flex shrink-0 items-center">
              <Image
                src="/logos.png"
                alt="Verdora Logo"
                width={100}
                height={60}
                className="h-auto w-14 sm:w-16"
              />
            </Link>

            <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              {/* Wishlist Icon */}
              <Link href="/wishlist" className="relative inline-flex items-center justify-center rounded-lg p-1 transition hover:bg-white/10">
                <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white transition hover:text-pink-400" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-pink-500 text-[9px] sm:text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link href="/cart" className="relative inline-flex items-center justify-center rounded-lg p-1 transition hover:bg-white/10">
                <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white transition hover:text-green-900" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="relative">
                {user ? (
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-lg p-1 text-white transition hover:bg-white/10 hover:text-green-100"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-lg p-1 text-white transition hover:bg-white/10 hover:text-green-100"
                    onClick={() => setShowAuth(true)}
                  >
                    <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                )}

                {user && dropdownOpen && (
                  <div className="absolute right-0 z-70 mt-2 w-40 sm:w-48 rounded-lg border border-gray-200 bg-white text-black shadow-xl">
                    <div className="border-b border-gray-200 bg-gray-50 px-2 sm:px-3 py-2">
                      <p className="truncate text-xs sm:text-sm font-semibold text-gray-800">
                        {user.name || "Hi"}
                      </p>
                      <p className="truncate text-[10px] sm:text-xs text-gray-500">
                        {user.email || user.mobile}
                      </p>
                    </div>
                    <ul className="py-1">
                      <li
                        className="flex cursor-pointer items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs text-gray-700 transition hover:bg-gray-100"
                        onClick={() => {
                          setDropdownOpen(false);
                          router.push("/profile");
                        }}
                      >
                        <UserIcon className="h-4 w-4 flex-shrink-0 text-blue-600" />
                        <span>My Profile</span>
                      </li>
                      <li
                        className="flex cursor-pointer items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs text-gray-700 transition hover:bg-gray-100"
                        onClick={() => {
                          setDropdownOpen(false);
                          router.push("/orders");
                        }}
                      >
                        <ClockIcon className="h-4 w-4 flex-shrink-0 text-orange-600" />
                        <span>Orders</span>
                      </li>
                      <li className="border-t border-gray-200"></li>
                      <li
                        className="flex cursor-pointer items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <ArrowLeftOnRectangleIcon className="h-4 w-4 flex-shrink-0" />
                        <span>Logout</span>
                      </li>
                    </ul>
                  </div>
                )}

                {showAuth && (
                  <AuthPopup
                    onClose={() => setShowAuth(false)}
                    onLogin={() => setShowAuth(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Category + Search + Location */}
          <div className="flex w-full gap-2 sm:gap-2.5 items-stretch">
            <div className="flex-shrink-0">
              <CategoryDropdown
                onToggle={() => setBrowseOpen(!browseOpen)}
                isOpen={browseOpen}
              />
            </div>
            <div className="min-w-0 flex-1">
              <SearchBar mobile={true} />
            </div>
            <div className="flex-shrink-0 max-w-[40%]">
              {renderLocationCard()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
