import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

interface VendorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorRegistrationModal({
  isOpen,
  onClose,
}: VendorRegistrationModalProps) {
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

      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Become a Vendor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center">
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
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Thank You!
              </h3>
              <p className="text-gray-600">
                We will contact you shortly to complete your vendor registration.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Shop/Business Name *
                </label>
                <input
                  type="text"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your shop/business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your business address"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
