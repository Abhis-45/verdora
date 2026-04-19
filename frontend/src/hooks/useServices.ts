/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";

// Mock services data as fallback
const MOCK_SERVICES = [
  {
    slug: "plant-care",
    _id: "plant-care",
    title: "Plant Care & Maintenance",
    desc: "Keep your plants healthy and thriving with our expert care.",
    details: "Our plant care service includes watering, pruning, fertilization, and pest control to ensure your plants stay vibrant all year round.",
    image: "/images/plant-care.jpg",
    packages: [
      { _id: "basic-care", name: "Basic Care", desc: "Weekly watering and pruning for small gardens.", price: 499 },
      { _id: "premium-care", name: "Premium Care", desc: "Comprehensive care including fertilization and pest control.", price: 999 }
    ],
    isActive: true
  },
  {
    slug: "home-decor",
    _id: "home-decor",
    title: "Home Decor & Styling",
    desc: "Elevate your living spaces with elegant, plant-inspired decor.",
    details: "We design and style homes with lush greenery, natural accents, and premium plant-based decor that brings warmth and sophistication to your interiors.",
    image: "/images/home-decor.jpg",
    packages: [
      { _id: "living-room", name: "Living Room Styling", desc: "Transform your living room with curated plants, accent pieces, and cozy layouts.", price: 2499 },
      { _id: "bedroom", name: "Bedroom Decor", desc: "Create a calming, nature-inspired bedroom with elegant plant styling.", price: 1499 },
      { _id: "balcony", name: "Balcony & Outdoor Styling", desc: "Design refreshing balcony and patio spaces with greenery and decor accents.", price: 999 }
    ],
    isActive: true
  },
  {
    slug: "landscaping",
    _id: "landscaping",
    title: "Landscaping & Garden Design",
    desc: "Create stunning outdoor spaces with our expert landscaping.",
    details: "From concept to completion, we design and build gardens that inspire.",
    image: "/images/landscaping.jpg",
    packages: [
      { _id: "basic-landscaping", name: "Basic Landscaping", desc: "Simple layouts for small spaces.", price: 4999 },
      { _id: "premium-landscaping", name: "Premium Landscaping", desc: "Full-scale design with premium plants and features.", price: 9999 }
    ],
    isActive: true
  }
];

interface Package {
  _id?: string;
  id?: string;
  name: string;
  desc: string;
  price: number;
}

interface Service {
  _id?: string;
  slug: string;
  title: string;
  desc: string;
  details: string;
  packages: Package[];
  image?: string;
  isActive?: boolean;
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

        const response = await fetch(`${BACKEND_URL}/api/services`, {
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (!response.ok) {
          console.warn(`⚠️ API returned ${response.status}, using mock data`);
          // Use mock data as fallback
          const transformedServices = MOCK_SERVICES.map((service: any) => ({
            ...service,
            id: service._id,
            packages: service.packages.map((pkg: any) => ({
              ...pkg,
              id: pkg._id,
            })),
          }));
          setServices(transformedServices);
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        // If no data from API, use mock data
        if (!data || data.length === 0) {
          console.warn("⚠️ No services from API, using mock data");
          const transformedServices = MOCK_SERVICES.map((service: any) => ({
            ...service,
            id: service._id,
            packages: service.packages.map((pkg: any) => ({
              ...pkg,
              id: pkg._id,
            })),
          }));
          setServices(transformedServices);
          setLoading(false);
          return;
        }
        
        // Transform MongoDB _id to id for compatibility
        const transformedServices = data.map((service: any) => ({
          ...service,
          id: service._id,
          packages: service.packages.map((pkg: any) => ({
            ...pkg,
            id: pkg._id || pkg.name.toLowerCase().replace(/\s+/g, "-"),
          })),
        }));

        setServices(transformedServices);
      } catch (err) {
        console.warn("⚠️ Failed to fetch services, using mock data:", err);
        // Use mock data as fallback
        const transformedServices = MOCK_SERVICES.map((service: any) => ({
          ...service,
          id: service._id,
          packages: service.packages.map((pkg: any) => ({
            ...pkg,
            id: pkg._id,
          })),
        }));
        setServices(transformedServices);
        setError(null); // Clear error since we have fallback data
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { services, loading, error };
}
