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
      <div className="mx-auto w-full max-w-full px-2 sm:px-4 md:px-6 lg:px-8">
        {/* Desktop & Tablet Layout (md and up) */}
        <div className="hidden w-full items-center justify-between gap-2 py-2 md:flex md:gap-3 md:py-2.5 lg:gap-4 lg:py-3">
          {/* Logo */}
          <div className="flex shrink-0 items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logos.png"
                alt="Verdora Logo"
                width={100}
                height={60}
                className="h-auto w-14 md:w-16 lg:w-20"
              />
            </Link>
          </div>

          {/* Category Dropdown - Hidden on md, visible on lg+ */}
          <div className="hidden lg:block flex-shrink-0">
            <CategoryDropdown />
          </div>

          {/* Search Bar - Takes available space */}
          <div className="flex flex-1 min-w-0 items-center">
            <SearchBar />
          </div>

          {/* Right Side Icons */}
          <div className="flex shrink-0 items-center gap-1 md:gap-2 lg:gap-3">
            {/* Location Card - Responsive sizing */}
            <div className="hidden lg:block w-56">
              {renderLocationCard()}
            </div>

            {/* Wishlist Icon */}
            <Link href="/wishlist" className="relative p-1 md:p-1.5 transition hover:bg-white/10 rounded-lg">
              <HeartIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white transition hover:text-pink-400" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 md:-right-2 md:-top-2 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] md:text-xs font-bold text-white animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link href="/cart" className="relative p-1 md:p-1.5 transition hover:bg-white/10 rounded-lg">
              <ShoppingCartIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white transition hover:text-green-900" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 md:-right-2 md:-top-2 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-red-500 text-[10px] md:text-xs font-bold text-white animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative">
              {user ? (
                <button
                  type="button"
                  className="flex items-center gap-1 md:gap-1.5 text-white transition hover:text-green-100 p-1 md:p-1.5 rounded-lg hover:bg-white/10"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <UserCircleIcon className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  <span className="hidden text-xs md:text-sm lg:inline font-medium">
                    {user.name || "Hi"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1 md:gap-1.5 text-white transition hover:text-green-100 p-1 md:p-1.5 rounded-lg hover:bg-white/10"
                  onClick={() => setShowAuth(true)}
                >
                  <UserCircleIcon className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  <span className="hidden text-xs md:text-sm lg:inline">Login</span>
                </button>
              )}

              {user && dropdownOpen && (
                <div className="absolute right-0 z-70 mt-2 w-48 md:w-56 rounded-lg border border-gray-200 bg-white text-black shadow-xl">
                  <div className="border-b border-gray-200 bg-gray-50 px-3 md:px-4 py-2 md:py-3">
                    <p className="text-xs md:text-sm font-semibold text-gray-800 truncate">
                      {user.name || "Hi"}
                    </p>
                    <p className="text-[11px] md:text-xs text-gray-500 truncate">
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
                      <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-blue-600 shrink-0" />
                      <span>My Profile</span>
                    </li>
                    <li
                      className="flex cursor-pointer items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm text-gray-700 transition hover:bg-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/orders");
                      }}
                    >
                      <ClockIcon className="h-4 w-4 md:h-5 md:w-5 text-orange-600 shrink-0" />
                      <span>Order History</span>
                    </li>
                    <li className="border-t border-gray-200"></li>
                    <li
                      className="flex cursor-pointer items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-red-600 transition hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <ArrowLeftOnRectangleIcon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
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

        {/* Location Card for Tablet (md-lg) */}
        <div className="hidden md:flex lg:hidden w-full px-2 py-2 gap-2 border-t border-green-500/20">
          <div className="flex-1">
            {renderLocationCard()}
          </div>
        </div>

        {/* Category + Search for Tablet (md-lg) */}
        <div className="hidden md:flex lg:hidden w-full px-2 py-2 gap-2 border-t border-green-500/20">
          <div className="w-auto flex-shrink-0">
            <CategoryDropdown
              onToggle={() => setBrowseOpen(!browseOpen)}
              isOpen={browseOpen}
            />
          </div>
          <div className="flex-1">
            <SearchBar mobile={false} />
          </div>
        </div>

        {/* Mobile Layout (Below md) */}
        <div className="flex w-full flex-col items-stretch gap-2 px-2 sm:px-3 py-2 sm:py-3 md:hidden">
          {/* Top Row: Logo + Icons */}
          <div className="flex w-full items-center justify-between gap-2 sm:gap-3">
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/logos.png"
                alt="Verdora Logo"
                width={70}
                height={70}
                className="h-auto w-14 sm:w-16"
              />
            </Link>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Link href="/wishlist" className="relative p-1 transition hover:bg-white/10 rounded-lg">
                <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white transition hover:text-pink-400" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-pink-500 text-[9px] sm:text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link href="/cart" className="relative p-1 transition hover:bg-white/10 rounded-lg">
                <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white transition hover:text-green-900" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Auth Icon - Fixed for mobile */}
              <div className="relative">
                {user ? (
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-lg p-1 text-white transition hover:bg-white/10 hover:text-green-100"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-label="User menu"
                  >
                    <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-lg p-1 text-white transition hover:bg-white/10 hover:text-green-100"
                    onClick={() => setShowAuth(true)}
                    aria-label="Login"
                  >
                    <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                )}

                {user && dropdownOpen && (
                  <div className="absolute right-0 z-70 mt-2 w-40 sm:w-48 rounded-lg border border-gray-200 bg-white text-black shadow-xl">
                    <div className="border-b border-gray-200 bg-gray-50 px-2 sm:px-3 py-2">
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                        {user.name || "Hi"}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">
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
                        <UserIcon className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>My Profile</span>
                      </li>
                      <li
                        className="flex cursor-pointer items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs text-gray-700 transition hover:bg-gray-100"
                        onClick={() => {
                          setDropdownOpen(false);
                          router.push("/orders");
                        }}
                      >
                        <ClockIcon className="h-4 w-4 text-orange-600 shrink-0" />
                        <span>Orders</span>
                      </li>
                      <li className="border-t border-gray-200"></li>
                      <li
                        className="flex cursor-pointer items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <ArrowLeftOnRectangleIcon className="h-4 w-4 shrink-0" />
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

          {/* Location Card */}
          <div>
            {renderLocationCard()}
          </div>

          {/* Search Bar + Category */}
          <div className="flex w-full gap-2">
            <div className="w-auto">
              <CategoryDropdown
                onToggle={() => setBrowseOpen(!browseOpen)}
                isOpen={browseOpen}
              />
            </div>
            <div className="flex-1">
              <SearchBar mobile={true} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
