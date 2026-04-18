/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  SparklesIcon,
  ShoppingBagIcon,
  HomeIcon,
  BeakerIcon,
  CheckBadgeIcon,
  StarIcon,
  PaintBrushIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import servicesData from "../../data/services.json";
import { getFromBackend } from "../../lib/fetchWrapper";
import Spinner from "../shared/Spinner";

interface Category {
  name: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

interface Package {
  id: string;
  name: string;
  desc: string;
  price: number;
}

interface Service {
  slug: string;
  title: string;
  icon?: React.ReactNode;
  desc: string;
  details?: string;
  packages?: Package[];
  image?: string;
}

interface Props {
  onToggle?: () => void;
  isOpen?: boolean;
}

export default function CategoryDropdown({
  onToggle,
  isOpen: controlledIsOpen,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
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

  // Use controlled state if provided, otherwise use internal state
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  // Helper function to close dropdown in both modes
  const closeDropdown = () => {
    if (controlledIsOpen !== undefined && onToggle) {
      // Controlled mode (mobile): call toggle if dropdown is open
      if (controlledIsOpen) {
        onToggle();
      }
    } else {
      // Uncontrolled mode (desktop): set internal state
      setInternalOpen(false);
    }
  };

  const handleBookPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setBookingData({
      name: "",
      email: "",
      phone: "",
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
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        selectedDate: bookingData.selectedDate,
        selectedTime: bookingData.selectedTime,
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        message: bookingData.message,
      };

      const response = await fetch(`${BACKEND_URL}/api/profile/bookService`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined" &&
          localStorage.getItem("token")
            ? {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }
            : {}),
        },
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

  const iconMap: Record<string, React.ReactNode> = {
    "flowering plants": <SparklesIcon className="w-5 h-5" />,
    "indoor plants": <HomeIcon className="w-5 h-5" />,
    "seeds & bulbs": <CheckBadgeIcon className="w-5 h-5" />,
    tools: <BeakerIcon className="w-5 h-5" />,
    fertilizers: <StarIcon className="w-5 h-5" />,
    pots: <BeakerIcon className="w-5 h-5" />,
    pesticides: <CheckBadgeIcon className="w-5 h-5" />,
    gifts: <ShoppingBagIcon className="w-5 h-5" />,
  };

  const colorMap: Record<string, string> = {
    "flowering plants": "text-pink-600",
    "indoor plants": "text-green-600",
    "seeds & bulbs": "text-amber-600",
    tools: "text-yellow-600",
    fertilizers: "text-orange-600",
    pots: "text-purple-600",
    pesticides: "text-red-600",
    gifts: "text-red-500",
  };

  const serviceIconMap: Record<string, React.ReactNode> = {
    "plant-care": <SparklesIcon className="w-5 h-5" />,
    "home-decor": <PaintBrushIcon className="w-5 h-5" />,
    landscaping: <StarIcon className="w-5 h-5" />,
    "garden-design": <CheckBadgeIcon className="w-5 h-5" />,
    "pest-control": <BeakerIcon className="w-5 h-5" />,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch from backend using wrapper
      const data = await getFromBackend<any>("/api/products");
      if (data) {
        const productsArray = Array.isArray(data) ? data : data.products || [];

        const uniqueCategories = [
          ...new Set(productsArray.map((p: any) => p.category)),
        ];

        const categoryList: Category[] = (
          uniqueCategories.filter((cat) => cat) as string[]
        ).map((cat: string) => ({
          name: cat,
          icon: iconMap[cat.toLowerCase()] || (
            <ShoppingBagIcon className="w-5 h-5" />
          ),
          path: `/products?category=${encodeURIComponent(cat)}`,
          color: colorMap[cat.toLowerCase()] || "text-green-600",
        }));

        setCategories(categoryList);
      } else {
        throw new Error("Failed to fetch products");
      }

      // Load services from JSON with full details
      const servicesList: Service[] = servicesData.map((service: any) => ({
        slug: service.slug,
        title: service.title,
        desc: service.desc,
        details: service.details,
        packages: service.packages,
        image: service.image,
        icon: serviceIconMap[service.slug] || (
          <SparklesIcon className="w-5 h-5" />
        ),
      }));
      setServices(servicesList);
    } catch {
      // Silently fail for CategoryDropdown - still shows services from JSON
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        // Only use hover on desktop (uncontrolled mode)
        if (controlledIsOpen === undefined) {
          setInternalOpen(true);
        }
      }}
      onMouseLeave={() => {
        // Only use hover on desktop (uncontrolled mode)
        if (controlledIsOpen === undefined) {
          setInternalOpen(false);
        }
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => {
          if (controlledIsOpen !== undefined && onToggle) {
            // Mobile: controlled mode - call parent toggle
            onToggle();
          } else {
            // Desktop: uncontrolled mode - toggle internal state
            setInternalOpen(!internalOpen);
          }
        }}
        className="flex items-center gap-2 text-white hover:text-green-100 transition py-2"
      >
        <Bars3Icon className="h-6 w-6" />
        <span className="hidden sm:inline font-medium text-sm">Browse</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-0 w-screen max-w-6xl bg-white rounded-b-lg shadow-2xl z-50">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Categories Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingBagIcon className="w-5 h-5 text-green-600" />
                    Categories
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map((category) => (
                      <Link
                        key={category.name}
                        href={category.path}
                        onClick={() => closeDropdown()}
                        className="p-3 rounded-lg hover:bg-gray-50 transition group"
                      >
                        <div className={`${category.color} mb-2`}>
                          {category.icon}
                        </div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition line-clamp-2">
                          {category.name}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Services Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-blue-600" />
                    Services
                  </h3>
                  <div className="space-y-2">
                    {services.map((service) => (
                      <button
                        key={service.slug}
                        onClick={() => setSelectedService(service)}
                        className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition group block"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-blue-600 mt-0.5">
                            {service.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition">
                              {service.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {service.desc}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Service Details Modal */}
      {selectedService && !selectedPackage && (
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
            <p className="text-sm text-gray-600 mb-4">
              {selectedService.details || selectedService.desc}
            </p>

            <h3 className="text-md font-semibold text-green-600 mb-3">
              Available Packages
            </h3>
            <div className="space-y-3">
              {selectedService.packages && selectedService.packages.length > 0 ? (
                selectedService.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="border rounded-md p-3 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {pkg.name}
                        </h4>
                        <p className="text-xs text-gray-600">{pkg.desc}</p>
                      </div>
                      <span className="text-xs text-gray-600"> Start from</span>
                      <span className="text-sm font-bold text-green-600">
                        ₹{pkg.price}
                      </span>
                    </div>
                    <button
                      onClick={() => handleBookPackage(pkg)}
                      className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-2 text-xs font-semibold rounded transition"
                    >
                      Book Now
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No packages available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {selectedPackage && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedPackage(null);
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
                  placeholder="10-digit phone number"
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
                  min={new Date().toISOString().split("T")[0]}
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
                  <option value="5:00 PM">5:00 PM</option>
                  <option value="6:00 PM">6:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Additional Message (Optional)
                </label>
                <textarea
                  name="message"
                  value={bookingData.message}
                  onChange={handleBookingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 font-semibold rounded-md transition flex items-center justify-center gap-2"
              >
                {bookingSubmitting ? (
                  <>
                    <Spinner />
                    Booking...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
