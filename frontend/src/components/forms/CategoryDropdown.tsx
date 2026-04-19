"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  SparklesIcon,
  ShoppingBagIcon,
  HomeIcon,
  BeakerIcon,
  CheckBadgeIcon,
  StarIcon,
  Bars3Icon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/solid";
import { getFromBackend } from "../../lib/fetchWrapper";
import { useServices } from "../../hooks/useServices";
import ServicesList from "../services/ServicesList";
import Spinner from "../shared/Spinner";

interface Category {
  name: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

interface ProductSummary {
  category?: string;
}

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
  const [loading, setLoading] = useState(true);
  const { services, loading: servicesLoading } = useServices();
  const [showServicesList, setShowServicesList] = useState(false);

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

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getFromBackend<
        ProductSummary[] | { products?: ProductSummary[] }
      >("/api/products");
      if (data) {
        const productsArray = Array.isArray(data) ? data : data.products || [];

        const uniqueCategories = [
          ...new Set(productsArray.map((product) => product.category)),
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
    } catch {
      // Silently fail for CategoryDropdown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

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
                    <Link
                      href={`/products`}
                      onClick={() => closeDropdown()}
                      className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base flex gap-1 items-center transition"
                    >
                      View All
                      <ArrowRightCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Link>
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

                {/* Services Section - Using Reusable Component */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-blue-600" />
                    Services
                    <Link
                      href={`/services`}
                      onClick={() => closeDropdown()}
                      className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base flex gap-1 items-center transition"
                    >
                      View All
                      <ArrowRightCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Link>
                  </h3>

                  {servicesLoading ? (
                    <div className="flex justify-center py-4">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {services.map((service) => (
                        <button
                          key={service.slug}
                          onClick={() => {
                            setShowServicesList(true);
                            closeDropdown();
                          }}
                          className="w-full text-left p-3 rounded-lg hover:bg-blue-50 transition group block"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-blue-600 mt-0.5">
                              <SparklesIcon className="w-5 h-5" />
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
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services List Modal - Using Reusable Component */}
      {showServicesList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-green-700">Our Services</h2>
              <button
                onClick={() => setShowServicesList(false)}
                className="text-gray-500 hover:text-red-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ServicesList
                services={services}
                loading={servicesLoading}
                showFullGrid={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
