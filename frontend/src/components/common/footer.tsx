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
    <footer className="border-t border-gray bg-green-950 text-white mt-8 sm:mt-12">
      <div className="w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12">
        {/* Newsletter Subscribe Section - TOP */}
        <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-700">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-center">
            Subscribe for Gardening Tips & Offers
          </h3>
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              suppressHydrationWarning
              className={`flex-1 w-full px-2 sm:px-3 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm rounded border focus:outline-none focus:ring-2 focus:ring-green-400 ${
                feedback?.type === "error"
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300 bg-white text-gray-800"
              }`}
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-4 sm:px-6 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm bg-gradient-to-r from-green-400 to-emerald-600 text-white rounded font-medium hover:scale-105 transition"
            >
              Subscribe
            </button>
          </form>

          {feedback?.type === "error" && (
            <p className="mt-2 sm:mt-3 text-red-400 text-[10px] sm:text-xs md:text-sm text-center">
              {feedback.msg}
            </p>
          )}
          {feedback?.type === "success" && (
            <p className="mt-2 sm:mt-3 text-green-400 text-[10px] sm:text-xs md:text-sm text-center">
              {feedback.msg}
            </p>
          )}
        </div>

        {/* Desktop footer (lg+) */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-6 lg:gap-8">
            <div>
              <div className="mb-3 lg:mb-4">
                <img
                  src="/logos.png"
                  alt="Verdora Logo"
                  className="h-10 lg:h-12 w-auto mb-2 lg:mb-3"
                />
              </div>
              <p className="text-xs lg:text-sm text-gray-300 leading-relaxed">
                Verdora – A complete online marketplace platform for nursery businesses enabling them to sell products, manage vendors, and serve customers at scale.
              </p>
            </div>
            <div>
              <h4 className="text-sm lg:text-lg font-semibold mb-2 lg:mb-4">Quick Links</h4>
              <ul className="space-y-1 lg:space-y-2 text-xs lg:text-sm">
                <li><Link href="/" className="text-gray-300 hover:text-white transition">Home</Link></li>
                <li><Link href="/products" className="text-gray-300 hover:text-white transition">Products</Link></li>
                <li><Link href="/services" className="text-gray-300 hover:text-white transition">Services</Link></li>
                <li><Link href="/about" className="text-gray-300 hover:text-white transition">About</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm lg:text-lg font-semibold mb-2 lg:mb-4">Support</h4>
              <ul className="space-y-1 lg:space-y-2 text-xs lg:text-sm">
                <li><Link href="/404" className="text-gray-300 hover:text-white transition">FAQ</Link></li>
                <li><Link href="/404" className="text-gray-300 hover:text-white transition">Shipping</Link></li>
                <li><Link href="/404" className="text-gray-300 hover:text-white transition">Returns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm lg:text-lg font-semibold mb-2 lg:mb-4">Access</h4>
              <ul className="space-y-1 lg:space-y-2 text-xs lg:text-sm">
                <li><Link href="/vendor/vendor-signup" className="text-gray-300 hover:text-white transition">Become a Vendor</Link></li>
                <li><Link href="/vendor/login" className="text-gray-300 hover:text-white transition">Vendor Login</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tablet footer (md - lg) */}
        <div className="hidden md:block lg:hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <img
                  src="/logos.png"
                  alt="Verdora Logo"
                  className="h-10 lg:h-12 w-auto mb-2 lg:mb-3"
                />
              <p className="text-xs lg:text-sm text-gray-300 leading-relaxed">
                Verdora – A complete online marketplace platform for nursery businesses enabling them to sell products, manage vendors, and serve customers at scale.
              </p>
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-semibold mb-2">Quick Links</h4>
              <ul className="space-y-1 text-xs md:text-sm">
                <li><Link href="/" className="text-gray-300 hover:text-white transition">Home</Link></li>
                <li><Link href="/products" className="text-gray-300 hover:text-white transition">Products</Link></li>
                <li><Link href="/services" className="text-gray-300 hover:text-white transition">Services</Link></li>
                <li><Link href="/about" className="text-gray-300 hover:text-white transition">About</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-semibold mb-2">Access</h4>
              <ul className="space-y-1 text-xs md:text-sm">
                <li><Link href="/vendor/vendor-signup" className="text-gray-300 hover:text-white transition">Become Vendor</Link></li>
                <li><Link href="/vendor/login" className="text-gray-300 hover:text-white transition">Vendor Login</Link></li>
              </ul>
            </div>
        </div>

        {/* Mobile footer (below md) */}
        <div className="block md:hidden">
          <div className="text-center space-y-3 sm:space-y-4">
                <img
                  src="/logos.png"
                  alt="Verdora Logo"
                  className="h-10 lg:h-12 w-auto mb-2 lg:mb-3"
                />
              <p className="text-xs lg:text-sm text-gray-300 leading-relaxed">
                Verdora – A complete online marketplace platform for nursery businesses enabling them to sell products, manage vendors, and serve customers at scale.
              </p>
            <div className="border-t border-gray-700 pt-2 sm:pt-3">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 mb-1.5 sm:mb-2">
                NAVIGATE
              </p>
              <div className="flex justify-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm">
                <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
                <Link href="/products" className="text-gray-300 hover:text-white">Products</Link>
                <Link href="/services" className="text-gray-300 hover:text-white">Services</Link>
                <Link href="/about" className="text-gray-300 hover:text-white">About</Link>
                <Link href="/contact" className="text-gray-300 hover:text-white">Contact</Link>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-2 sm:pt-3">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 mb-1.5 sm:mb-2">
                ACCESS
              </p>
              <div className="flex justify-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm">
                <Link href="/vendor/vendor-signup" className="text-gray-300 hover:text-white">Become Vendor</Link>
                <Link href="/vendor/login" className="text-gray-300 hover:text-white">Vendor Login</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700">
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-300">
            &copy; 2026 Verdora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
