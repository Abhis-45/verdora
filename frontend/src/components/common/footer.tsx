/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setFeedback({ type: "error", msg: "Email is required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setFeedback({ type: "error", msg: "Invalid email format" });

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: "success",
          msg: data.message || "Thank you — check your email.",
        });
        setEmail("");
      } else {
        setFeedback({
          type: "error",
          msg: data.message || "Subscription failed.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        msg: "Subscription failed. Please try again.",
      });
    }
  };

  return (
    <footer className="border-t border-gray bg-green-950 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Newsletter Subscribe Section - TOP */}
        <div className="mb-8 pb-8 border-b border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Subscribe for Gardening Tips & Offers
          </h3>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`flex-1 w-full p-2 sm:p-3 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-green-400 ${feedback?.type === "error"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-white text-gray-800"
                }`}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 sm:py-3 text-sm bg-linear-to-r from-green-400 to-emerald-600 text-white rounded font-medium hover:scale-105 transition"
            >
              Subscribe
            </button>
          </form>

          {feedback?.type === "error" && (
            <p className="mt-3 text-red-400 text-xs sm:text-sm text-center">
              {feedback.msg}
            </p>
          )}
          {feedback?.type === "success" && (
            <p className="mt-3 text-green-400 text-xs sm:text-sm text-center">
              {feedback.msg}
            </p>
          )}
        </div>
        {/* Desktop footer (xl+) */}
        <div className="hidden xl:block">
          <div className="grid grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <img
                  src="/logos.png"
                  alt="Verdora Logo"
                  className="h-12 w-auto mb-3"
                />
              </div>
              <p className="text-sm text-gray-300">
                Verdora – A complete online marketplace platform for nursery businesses enabling them to sell products, manage vendors, and serve customers at scale.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-gray-300 hover:text-white transition"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    className="text-gray-300 hover:text-white transition"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="text-gray-300 hover:text-white transition"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-300 hover:text-white transition"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-300 hover:text-white transition"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/404"
                    className="text-gray-300 hover:text-white transition"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/404"
                    className="text-gray-300 hover:text-white transition"
                  >
                    Shipping
                  </Link>
                </li>
                <li>
                  <Link
                    href="/404"
                    className="text-gray-300 hover:text-white transition"
                  >
                    Returns
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Access</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/vendor/vendor-signup"
                    className="text-gray-300 hover:text-white transition"
                  >
                    Become a Vendor
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vendor/login"
                    className="text-gray-300 hover:text-white transition"
                  >
                    Vendor Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tablet footer (md - lg) */}
        <div className="hidden md:block xl:hidden">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-base font-semibold mb-3">Verdora</h4>
              <p className="text-sm text-gray-300">
                Fresh plants & garden supplies.
              </p>
            </div>
            <div>
              <h4 className="text-base font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-gray-300 hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    className="text-gray-300 hover:text-white"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services"
                    className="text-gray-300 hover:text-white"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-gray-300 hover:text-white"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-gray-300 hover:text-white"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold mb-3">Access</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/vendor/vendor-signup"
                    className="text-gray-300 hover:text-white"
                  >
                    Become a Vendor
                  </Link>
                </li>
                <li>
                  <Link
                    href="/vendor/login"
                    className="text-gray-300 hover:text-white"
                  >
                    Vendor Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile footer (sm and below) */}
        <div className="block md:hidden">
          <div className="text-center">
            <p className="text-sm text-gray-300 mb-4">
              Verdora — fresh plants delivered to your door.
            </p>
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">
                  NAVIGATE
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link
                    href="/"
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    Home
                  </Link>
                  <Link
                    href="/products"
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    Products
                  </Link>
                  <Link
                    href="/services"
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    Services
                  </Link>
                  <Link
                    href="/about"
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    Contact
                  </Link>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-3">
                <p className="text-xs font-semibold text-gray-400 mb-2">
                  ACCESS
                </p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link
                    href="/vendor/vendor-signup"
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    Become a Vendor
                  </Link>
                  <Link
                    href="/vendor/login"
                    className="text-gray-300 hover:text-white text-sm"
                  >
                    Vendor
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-8 pt-8 border-t border-gray-700">
          <p className="text-xs sm:text-sm text-gray-300">
            &copy; 2026 Verdora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
