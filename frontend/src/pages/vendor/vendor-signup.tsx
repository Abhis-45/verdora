/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/solid";

export default function VendorSignup() {
  const [formData, setFormData] = useState({
    vendorName: "",
    businessName: "",
    email: "",
    password: "",
    mobileNumber: "",
    businessPhone: "",
    businessLocation: "",
    businessDescription: "",
    businessWebsite: "",
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
        `${BACKEND_URL}/api/admin/vendor/register`,
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
        businessName: "",
        email: "",
        password: "",
        mobileNumber: "",
        businessPhone: "",
        businessLocation: "",
        businessDescription: "",
        businessWebsite: "",
      });

      // Auto redirect after 5 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 5000);
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
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="rounded-full bg-blue-100 p-3">
                        <svg
                          className="h-12 w-12 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-blue-900 mb-2">
                      Application Submitted!
                    </h3>
                    <p className="text-blue-700 mb-3">
                      Your vendor account has been created and is now <strong>pending admin approval</strong>.
                    </p>
                    <div className="bg-white rounded border border-blue-300 p-4 mb-4 text-left">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Next Steps:</strong>
                      </p>
                      <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                        <li>Admin will review your application</li>
                        <li>You will receive an approval email once verified</li>
                        <li>After approval, you can log in to the dashboard</li>
                      </ul>
                    </div>
                    <p className="text-sm text-blue-600 mb-2">
                      Check your email: <strong>{formData.email}</strong>
                    </p>
                    <p className="text-sm text-blue-600 mb-3">
                      If you have questions, please contact: <strong>support@verdora.com</strong>
                    </p>
                    <p className="text-xs text-blue-500">
                      Redirecting to home page in 5 seconds...
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
                        Business Name *
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
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
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Create a secure password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        name="businessPhone"
                        value={formData.businessPhone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Optional: Enter your business phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Address *
                      </label>
                      <textarea
                        name="businessLocation"
                        value={formData.businessLocation}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Enter your business address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Description (Optional)
                      </label>
                      <textarea
                        name="businessDescription"
                        value={formData.businessDescription}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="Describe your business, products, and services"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website (Optional)
                      </label>
                      <input
                        type="url"
                        name="businessWebsite"
                        value={formData.businessWebsite}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        placeholder="https://yourbusiness.com"
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
