/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { HomeIcon } from "@heroicons/react/24/solid";

export default function AdminVendorSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    vendorName: "",
    businessName: "",
    businessPhone: "",
    businessLocation: "",
    businessWebsite: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const tok = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role");

    if (!tok || role !== "admin") {
      router.push("/admin/login");
      return;
    }

    setToken(tok);
  }, [router]);

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

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError("Username, email, and password are required");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (!formData.businessName) {
      setError("Business name is required");
      setLoading(false);
      return;
    }

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL ||
            "https://verdora.onrender.com"
          : "https://verdora.onrender.com";

      const response = await fetch(`${BACKEND_URL}/api/admin/create-vendor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          vendorName: formData.vendorName.trim(),
          businessName: formData.businessName.trim(),
          businessPhone: formData.businessPhone.trim(),
          businessLocation: formData.businessLocation.trim(),
          businessWebsite: formData.businessWebsite.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create vendor account");
        return;
      }

      setSuccess(true);
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        vendorName: "",
        businessName: "",
        businessPhone: "",
        businessLocation: "",
        businessWebsite: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/admin/dashboard?tab=vendor-requests");
      }, 2000);
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Vendor Account | Verdora Admin</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-white shadow-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-emerald-700">
              Verdora Admin
            </h1>
            <div className="flex gap-2">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 transition"
              >
                <HomeIcon className="w-5 h-5" /> Dashboard
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
                <h2 className="text-3xl font-bold mb-2">Create Vendor Account</h2>
                <p className="text-emerald-100">
                  Fill in the form below to create a new vendor account
                </p>
              </div>

              {/* Form */}
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
                      Vendor Account Created!
                    </h3>
                    <p className="text-green-700 mb-4">
                      The vendor account has been created successfully. The vendor can now log in with their credentials.
                    </p>
                    <p className="text-sm text-green-600">
                      Redirecting to dashboard...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
                        {error}
                      </div>
                    )}

                    {/* Vendor Account Credentials */}
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Vendor Account Credentials
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username *
                          </label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Enter vendor username"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Enter vendor email"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Enter password (min 6 characters)"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password *
                          </label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Confirm password"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Details */}
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Business Details
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vendor Name
                          </label>
                          <input
                            type="text"
                            name="vendorName"
                            value={formData.vendorName}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Enter vendor name"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Enter business name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Phone
                          </label>
                          <input
                            type="tel"
                            name="businessPhone"
                            value={formData.businessPhone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Enter business phone number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Location
                          </label>
                          <input
                            type="text"
                            name="businessLocation"
                            value={formData.businessLocation}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="Enter business location/address"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Website
                          </label>
                          <input
                            type="url"
                            name="businessWebsite"
                            value={formData.businessWebsite}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3">
                      <Link
                        href="/admin/dashboard?tab=vendor-requests"
                        className="flex-1 text-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {loading ? "Creating..." : "Create Vendor Account"}
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
