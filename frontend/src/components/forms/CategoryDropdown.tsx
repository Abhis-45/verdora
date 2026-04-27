"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  SparklesIcon,
  ShoppingBagIcon,
  Bars3Icon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/solid";
import { getFromBackend } from "../../lib/fetchWrapper";
import { useServices } from "../../hooks/useServices";
import ServicesList from "../services/ServicesList";
import Spinner from "../shared/Spinner";
import type { ServiceRecord } from "@/types/service";

interface Category {
  name: string;
  image: string;
  count: number;
  path: string;
}

interface CategorySummary {
  name: string;
  count: number;
  image?: string | null;
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
  const [loading, setLoading] = useState(true);
  const { services, loading: servicesLoading } = useServices();
  const [showServicesList, setShowServicesList] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(
    null,
  );

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

      const data = await getFromBackend<CategorySummary[]>(
        "/api/products/featured/categories",
      );
      if (data) {
        const categoryList: Category[] = data
          .filter((category) => category.name)
          .map((category) => ({
            name: category.name,
            count: category.count,
            image: category.image || "/placeholder.png",
            path: `/products?category=${encodeURIComponent(category.name)}`,
          }));

        setCategories(categoryList);
      } else {
        throw new Error("Failed to fetch categories");
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
      data-category-dropdown
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
        <div className="absolute left-0 top-full z-50 mt-1 w-[calc(100vw-1rem)] max-w-4xl overflow-hidden rounded-lg border border-gray-100 bg-white shadow-2xl md:w-[46rem] lg:w-[52rem]">
          <div className="max-h-[72vh] overflow-y-auto p-3 sm:p-4">
            {loading ? (
              <div className="text-center py-6 text-sm text-gray-400">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.25fr_0.9fr] md:gap-5">
                {/* Categories Section */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 sm:text-base">
                    <ShoppingBagIcon className="w-5 h-5 text-green-600" />
                    Categories
                    <Link
                      href={`/products`}
                      onClick={() => closeDropdown()}
                      className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-600 transition hover:text-green-700"
                    >
                      View All
                      <ArrowRightCircleIcon className="h-4 w-4" />
                    </Link>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {categories.map((category) => (
                      <Link
                        key={category.name}
                        href={category.path}
                        onClick={() => closeDropdown()}
                        className="group flex min-w-0 items-center gap-2 rounded-lg border border-gray-100 p-2 transition hover:border-green-200 hover:bg-green-50"
                      >
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-green-50">
                          <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-900 transition group-hover:text-green-700 sm:text-sm">
                            {category.name}
                          </p>
                          <p className="text-[10px] font-medium text-gray-500">
                            {category.count} items
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Services Section - Using Reusable Component */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 sm:text-base">
                    <SparklesIcon className="w-5 h-5 text-blue-600" />
                    Services
                    <Link
                      href={`/services`}
                      onClick={() => closeDropdown()}
                      className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-600 transition hover:text-green-700"
                    >
                      View All
                      <ArrowRightCircleIcon className="h-4 w-4" />
                    </Link>
                  </h3>

                  {servicesLoading ? (
                    <div className="flex justify-center py-4">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                      {services.map((service) => (
                        <button
                          key={service.slug}
                          type="button"
                          onClick={() => {
                            setSelectedService(service);
                            setShowServicesList(true);
                            closeDropdown();
                          }}
                          className="group block w-full rounded-lg border border-gray-100 p-2 text-left transition hover:border-blue-100 hover:bg-blue-50"
                        >
                          <div className="flex items-center gap-2">
                            <div className="mt-0.5 rounded-md bg-blue-50 p-2 text-blue-600">
                              <SparklesIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-gray-900 transition group-hover:text-blue-600 sm:text-sm">
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
      {showServicesList && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-green-700">
                {selectedService.title}
              </h2>
              <button
                onClick={() => {
                  setShowServicesList(false);
                  setSelectedService(null);
                }}
                className="text-gray-500 hover:text-red-600 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4 text-sm text-gray-600">
                {selectedService.details}
              </p>
              <ServicesList
                services={[selectedService]}
                loading={false}
                showFullGrid={false}
                variant="packages"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
