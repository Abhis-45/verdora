"use client";
import React, { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Spinner from "@/components/shared/Spinner";
import { useUser } from "@/context/UserContext";
import type { ServicePackage, ServiceRecord } from "@/types/service";

interface ServicesListProps {
  services: ServiceRecord[];
  loading?: boolean;
  showFullGrid?: boolean;
  variant?: "cards" | "packages";
  onBookingOpenChange?: (open: boolean) => void;
}

export default function ServicesList({
  services,
  loading = false,
  showFullGrid = true,
  variant = "cards",
  onBookingOpenChange,
}: ServicesListProps) {
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(
    null,
  );
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(
    null,
  );
  const [bookingData, setBookingData] = useState({
    name: "",
    email: "",
    phone: "",
    selectedDate: "",
    selectedTime: "",
    message: "",
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { user } = useUser();

  useEffect(() => {
    onBookingOpenChange?.(Boolean(selectedService || selectedPackage));
  }, [onBookingOpenChange, selectedPackage, selectedService]);

  const handleBookPackage = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setBookingData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.mobile || "",
      selectedDate: "",
      selectedTime: "",
      message: "",
    });
    setBookingMessage(null);
  };

  const handleBookingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedPackage) return;

    if (
      !bookingData.name ||
      !bookingData.email ||
      !bookingData.phone ||
      !bookingData.selectedDate ||
      !bookingData.selectedTime
    ) {
      setBookingMessage({
        type: "error",
        text: "Please fill in all required fields",
      });
      return;
    }

    setBookingSubmitting(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const payload = {
        serviceSlug: selectedService.slug,
        packageId: selectedPackage.id || selectedPackage._id,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        selectedDate: bookingData.selectedDate,
        selectedTime: bookingData.selectedTime,
        message: bookingData.message,
      };

      const response = await fetch(`${BACKEND_URL}/api/profile/bookService`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to book service");
      }

      setBookingMessage({
        type: "success",
        text: data.message || "Service booked successfully! We'll contact you soon.",
      });

      setTimeout(() => {
        setSelectedService(null);
        setSelectedPackage(null);
        setBookingData({
          name: "",
          email: "",
          phone: "",
          selectedDate: "",
          selectedTime: "",
          message: "",
        });
        setBookingMessage(null);
      }, 2000);
    } catch (error) {
      setBookingMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to book service. Please try again.",
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 rounded-lg shimmer" />
        ))}
      </div>
    );
  }

  const gridColsClass = showFullGrid
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      {/* Services Grid/List */}
      {variant === "packages" ? (
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.slug} className="rounded-lg border border-gray-100 p-3">
              <h4 className="mb-2 text-sm font-bold text-gray-900">
                {service.title}
              </h4>
              <div className="space-y-2">
                {service.packages.map((pkg) => (
                  <div
                    key={pkg.id || pkg._id}
                    className="flex items-center justify-between gap-3 rounded-md bg-gray-50 p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-900">
                        {pkg.name}
                      </p>
                      <p className="text-xs font-bold text-green-700">
                        Rs. {pkg.price}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedService(service);
                        handleBookPackage(pkg);
                      }}
                      className="shrink-0 rounded bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`grid ${gridColsClass} gap-5 sm:gap-6`}>
          {services.map((service) => (
            <div
              key={service.slug}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer overflow-hidden"
              onClick={() => setSelectedService(service)}
            >
              {/* Elegant Image */}
              <div className="relative h-28 sm:h-32 md:h-36 w-full">
                <Image
                  src={service.image || "/images/placeholder.jpg"}
                  alt={service.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Service Content */}
              <div className="p-3 sm:p-4 flex flex-col h-full">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                  {service.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                  {service.desc}
                </p>
                <p className="text-xs text-gray-700 mb-3 grow line-clamp-3">
                  {service.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Details Modal */}
      {variant === "cards" && selectedService && !selectedPackage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-green-700 mb-2">
              {selectedService.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4">{selectedService.details}</p>

            <h3 className="text-md font-semibold text-green-600 mb-3">
              Available Packages
            </h3>
            <div className="space-y-3">
              {selectedService.packages.map((pkg) => (
                <div
                  key={pkg.id || pkg._id}
                  className="border rounded-md p-3 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {pkg.name}
                      </h4>
                      <p className="text-xs text-gray-600">{pkg.desc}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-600">Start from</span>
                      <span className="text-lg font-bold text-green-600">
                        ₹{pkg.price}
                      </span>
                    </div>
                    <button
                      onClick={() => handleBookPackage(pkg)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {selectedPackage && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedPackage(null);
                if (variant === "packages") {
                  setSelectedService(null);
                }
                setBookingMessage(null);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-green-700 mb-1">
              Book {selectedService.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Package: <span className="font-semibold">{selectedPackage.name}</span> - ₹
              {selectedPackage.price}
            </p>

            {bookingMessage && (
              <div
                className={`p-3 rounded-md mb-4 text-sm font-semibold ${
                  bookingMessage.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {bookingMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={bookingData.name}
                  onChange={handleBookingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={bookingData.email}
                  onChange={handleBookingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={bookingData.phone}
                  onChange={handleBookingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  name="selectedDate"
                  value={bookingData.selectedDate}
                  onChange={handleBookingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Preferred Time *
                </label>
                <select
                  name="selectedTime"
                  value={bookingData.selectedTime}
                  onChange={handleBookingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select time</option>
                  <option value="9:00 AM">9:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="1:00 PM">1:00 PM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="3:00 PM">3:00 PM</option>
                  <option value="4:00 PM">4:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Additional Message
                </label>
                <textarea
                  name="message"
                  value={bookingData.message}
                  onChange={handleBookingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Any special requirements?"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full bg-green-600 text-white py-2 rounded-md font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {bookingSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner />
                    Booking...
                  </div>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
