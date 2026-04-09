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
        className="flex w-full items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2.5 py-2 text-left text-white transition hover:bg-white/20 sm:rounded-2xl sm:px-3 sm:py-2.5"
      >
        <MapPinIcon className="h-4 w-4 shrink-0 text-emerald-100 sm:h-5 sm:w-5" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-4 sm:text-sm sm:leading-5">
            {primaryLocationLine}
          </p>
          <p className="truncate text-[10px] leading-3 text-emerald-50 sm:text-xs sm:leading-4">
            {secondaryLocationLine}
          </p>
        </div>
      </button>

      {locationEditorOpen && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-[60vh] w-full overflow-y-auto rounded-lg border border-green-100 bg-white p-3 text-gray-900 shadow-2xl sm:max-h-[75vh] sm:rounded-2xl sm:p-4 md:left-auto md:right-0 md:w-80">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-900 sm:text-sm">
                Delivery pincode
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500 sm:mt-1 sm:text-xs">
                Enter 6-digit pincode
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 sm:px-2 sm:py-1 sm:text-[11px]">
              {deliveryLocation.pincode}
            </span>
          </div>
          <div className="mt-2 sm:mt-3">
            <PincodeSuggestions
              onSelect={handlePincodeSuggestionSelect}
              placeholder="Enter 6-digit pincode"
              className="relative"
              inputClassName="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-green-600 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="hidden w-full items-center justify-between gap-4 py-2 md:flex md:py-3">
          <div className="flex shrink-0 items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logos.png"
                alt="Verdora Logo"
                width={120}
                height={80}
                className="mr-2"
              />
            </Link>
          </div>

          <div className="hidden lg:block">
            <CategoryDropdown />
          </div>

          <div className="flex flex-1 items-center">
            <SearchBar />
          </div>

          <div className="flex shrink-0 items-center space-x-2">
            {renderLocationCard()}

            <Link href="/wishlist" className="relative">
              <HeartIcon className="h-10 w-10 text-white transition hover:text-pink-400" />
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative">
              <ShoppingCartIcon className="h-10 w-10 text-white transition hover:text-green-900" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            <div className="relative">
              {user ? (
                <button
                  type="button"
                  className="flex items-center gap-2 text-white transition hover:text-green-100"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <UserCircleIcon className="h-12 w-12" />
                  <span className="hidden text-sm font-medium sm:inline">
                    {user.name || "Hi"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-2 text-white transition hover:text-green-100"
                  onClick={() => setShowAuth(true)}
                >
                  <UserCircleIcon className="h-18 w-18" />
                  <span className="hidden text-sm sm:inline">Login</span>
                </button>
              )}

              {user && dropdownOpen && (
                <div className="absolute right-0 z-70 mt-3 w-56 rounded-lg border border-gray-200 bg-white text-black shadow-xl">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-800">
                      {user.name || "Hi"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.email || user.mobile}
                    </p>
                  </div>
                  <ul className="py-2">
                    <li
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-gray-700 transition hover:bg-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      <span>My Profile</span>
                    </li>
                    <li
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-gray-700 transition hover:bg-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/orders");
                      }}
                    >
                      <ClockIcon className="h-5 w-5 text-orange-600" />
                      <span>Order History</span>
                    </li>
                    <li className="border-t border-gray-200"></li>
                    <li
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 font-medium text-red-600 transition hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 w-5" />
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
      </div>

      <div className="flex w-full flex-col items-stretch gap-2 px-4 py-3 md:hidden">
        {/* Top Row: Logo + Icons */}
        <div className="flex w-full items-center justify-between gap-3">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logos.png"
              alt="Verdora Logo"
              width={70}
              height={70}
              className="h-auto w-16"
            />
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link href="/wishlist" className="relative">
              <HeartIcon className="h-6 w-6 text-white transition hover:text-pink-400" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative">
              <ShoppingCartIcon className="h-6 w-6 text-white transition hover:text-green-900" />
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth Icon - Fixed for mobile */}
            <div className="relative">
              {user ? (
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full p-1 text-white transition hover:bg-white/10 hover:text-green-100"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label="User menu"
                >
                  <UserCircleIcon className="h-6 w-6" />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex items-center justify-center rounded-full p-1 text-white transition hover:bg-white/10 hover:text-green-100"
                  onClick={() => setShowAuth(true)}
                  aria-label="Login"
                >
                  <UserCircleIcon className="h-6 w-6" />
                </button>
              )}

              {user && dropdownOpen && (
                <div className="absolute right-0 z-70 mt-2 w-44 rounded-lg border border-gray-200 bg-white text-black shadow-xl">
                  <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {user.name || "Hi"}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {user.email || user.mobile}
                    </p>
                  </div>
                  <ul className="py-1">
                    <li
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-gray-700 transition hover:bg-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <UserIcon className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>My Profile</span>
                    </li>
                    <li
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-gray-700 transition hover:bg-gray-100"
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
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
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
    </header>
  );
}
