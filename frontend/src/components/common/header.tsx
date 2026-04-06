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
    <div className="relative">
      <button
        onClick={() => {
          setLocationEditorOpen((current) => !current);
        }}
        className="flex w-full max-w-full items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 text-left text-white transition hover:bg-white/20 md:min-w-55 md:w-auto"
      >
        <MapPinIcon className="h-5 w-5 shrink-0 text-emerald-100" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-5">
            {primaryLocationLine}
          </p>
          <p className="truncate text-[11px] leading-4 text-emerald-50 sm:text-xs">
            {secondaryLocationLine}
          </p>
        </div>
      </button>

      {locationEditorOpen && (
        <div className="absolute left-0 right-0 z-50 mt-3 max-h-[75vh] w-full overflow-y-auto rounded-2xl border border-green-100 bg-white p-4 text-gray-900 shadow-2xl md:left-auto md:right-0 md:w-80">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-green-900">
                Delivery pincode
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Enter a 6-digit pincode to see city and state suggestions.
              </p>
            </div>
            <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">
              {deliveryLocation.pincode}
            </span>
          </div>
          <div className="mt-3">
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
        <div className="hidden w-full items-center justify-between gap-4 py-4 md:flex">
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

          <div className="flex shrink-0 items-center space-x-4">
            {renderLocationCard()}

            <Link href="/wishlist" className="relative">
              <HeartIcon className="h-7 w-7 text-white transition hover:text-pink-400" />
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative">
              <ShoppingCartIcon className="h-7 w-7 text-white transition hover:text-green-900" />
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
                  <UserCircleIcon className="h-8 w-8" />
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
                  <UserCircleIcon className="h-8 w-8" />
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

      <div className="flex w-full flex-col items-center gap-3 px-4 py-3 md:hidden">
        <div className="flex w-full items-center justify-between gap-2">
          <Link href="/" className="flex items-center">
            <Image
              src="/logos.png"
              alt="Verdora Logo"
              width={84}
              height={84}
              className="mr-2"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/wishlist" className="relative">
              <HeartIcon className="h-6 w-6 text-white transition hover:text-pink-400" />
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative">
              <ShoppingCartIcon className="h-6 w-6 text-white transition hover:text-green-900" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            <div className="relative">
              {user ? (
                <button
                  type="button"
                  className="rounded-full p-0.5 text-white transition hover:bg-white/10 hover:text-green-100"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <UserCircleIcon className="h-7 w-7" />
                </button>
              ) : (
                <button
                  type="button"
                  className="rounded-full p-0.5 text-white transition hover:bg-white/10 hover:text-green-100"
                  onClick={() => setShowAuth(true)}
                >
                  <UserCircleIcon className="h-7 w-7" />
                </button>
              )}

              {user && dropdownOpen && (
                <div className="absolute right-0 z-70 mt-3 w-48 rounded-lg border border-gray-200 bg-white text-black shadow-xl">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-800">
                      {user.name || "Hi"}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <ul className="py-2">
                    <li
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push("/profile");
                      }}
                    >
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      <span>My Profile</span>
                    </li>
                    <li
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
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
                      className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                      <span>Logout</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full">{renderLocationCard()}</div>

        <div className="flex w-full md:hidden gap-2 items-center">
          <CategoryDropdown
            onToggle={() => setBrowseOpen(!browseOpen)}
            isOpen={browseOpen}
          />
          <SearchBar mobile={true} />
        </div>
      </div>
    </header>
  );
}
