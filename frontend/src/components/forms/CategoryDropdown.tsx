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
} from "@heroicons/react/24/solid";
import servicesData from "../../data/services.json";

interface Category {
  name: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

interface Service {
  slug: string;
  title: string;
  icon: React.ReactNode;
  desc: string;
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

      // Create timeout promise for race condition
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Fetch timeout")),
          10000, // 10 seconds
        ),
      );

      const fetchPromise = fetch(`/api/products`, {
        method: "GET",
      });

      const response = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (response.ok) {
        const data = await response.json();
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
      }

      // Load services from JSON
      const servicesList: Service[] = servicesData.map((service: any) => ({
        slug: service.slug,
        title: service.title,
        desc: service.desc,
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
                      <Link
                        key={service.slug}
                        href={`/services#${service.slug}`}
                        onClick={() => closeDropdown()}
                        className="p-3 rounded-lg hover:bg-blue-50 transition group block"
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
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
