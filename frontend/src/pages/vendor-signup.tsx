/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/solid";

export default function VendorSignup() {
  const [formData, setFormData] = useState({
    vendorName: "",
    shopName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL ||
            "https://verdora.onrender.com"
          : "https://verdora.onrender.com";

      const response = await fetch(
        `${BACKEND_URL}/api/public/vendor-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit registration");
        return;
      }

      setSuccess(true);
      setFormData({
        vendorName: "",
        shopName: "",
        email: "",
        phone: "",
        address: "",
      });

      // Auto redirect after 3 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Become a Vendor | Verdora</title>
        <meta
          name="description"
          content="Register as a vendor on Verdora marketplace"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-white shadow-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-emerald-700">Verdora</h1>
            <div className="flex gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition"
              >
                <HomeIcon className="w-5 h-5" /> Home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg bg-white shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 text-white">
                <h2 className="text-3xl font-bold mb-2">Become a Vendor</h2>
                <p className="text-emerald-100">
                  Join Verdora marketplace and start selling your plants and
                  gardening products
                </p>
              </div>

              {/* Form Content */}
              <div className="p-6 sm:p-8">
                {success ? (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="rounded-full bg-green-100 p-3">
                        <svg
                          className="h-12 w-12 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-green-900 mb-2">
                      Thank You!
                    </h3>
                    <p className="text-green-700 mb-4">
                      We will contact you shortly to complete your vendor
                      registration.
                    </p>
                    <p className="text-sm text-green-600">
                      Redirecting to home page...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="vendorName"
                        value={formData.vendorName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Shop/Business Name *
                      </label>
                      <input
                        type="text"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Enter your shop/business name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Address *
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Enter your business address"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Link
                        href="/"
                        className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
                      >
                        Back to Home
                      </Link>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {loading ? "Submitting..." : "Submit Application"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
