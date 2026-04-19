import { useEffect, useState } from "react";
import {
  normalizeService,
  type ServiceRecord,
} from "@/types/service";

const MOCK_SERVICES: ServiceRecord[] = [
  {
    slug: "plant-care",
    _id: "plant-care",
    title: "Plant Care & Maintenance",
    desc: "Keep your plants healthy and thriving with our expert care.",
    details:
      "Our plant care service includes watering, pruning, fertilization, and pest control to ensure your plants stay vibrant all year round.",
    image: "/images/plant-care.jpg",
    packages: [
      {
        _id: "basic-care",
        name: "Basic Care",
        desc: "Weekly watering and pruning for small gardens.",
        price: 499,
      },
      {
        _id: "premium-care",
        name: "Premium Care",
        desc: "Comprehensive care including fertilization and pest control.",
        price: 999,
      },
    ],
    isActive: true,
  },
  {
    slug: "home-decor",
    _id: "home-decor",
    title: "Home Decor & Styling",
    desc: "Elevate your living spaces with elegant, plant-inspired decor.",
    details:
      "We design and style homes with lush greenery, natural accents, and premium plant-based decor that brings warmth and sophistication to your interiors.",
    image: "/images/home-decor.jpg",
    packages: [
      {
        _id: "living-room",
        name: "Living Room Styling",
        desc: "Transform your living room with curated plants, accent pieces, and cozy layouts.",
        price: 2499,
      },
      {
        _id: "bedroom",
        name: "Bedroom Decor",
        desc: "Create a calming, nature-inspired bedroom with elegant plant styling.",
        price: 1499,
      },
      {
        _id: "balcony",
        name: "Balcony & Outdoor Styling",
        desc: "Design refreshing balcony and patio spaces with greenery and decor accents.",
        price: 999,
      },
    ],
    isActive: true,
  },
  {
    slug: "landscaping",
    _id: "landscaping",
    title: "Landscaping & Garden Design",
    desc: "Create stunning outdoor spaces with our expert landscaping.",
    details:
      "From concept to completion, we design and build gardens that inspire.",
    image: "/images/landscaping.jpg",
    packages: [
      {
        _id: "basic-landscaping",
        name: "Basic Landscaping",
        desc: "Simple layouts for small spaces.",
        price: 4999,
      },
      {
        _id: "premium-landscaping",
        name: "Premium Landscaping",
        desc: "Full-scale design with premium plants and features.",
        price: 9999,
      },
    ],
    isActive: true,
  },
];

function getFallbackServices(): ServiceRecord[] {
  return MOCK_SERVICES.map(normalizeService);
}

export function useServices() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

        const response = await fetch(`${backendUrl}/api/services`, {
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          console.warn(`API returned ${response.status}, using mock data`);
          setServices(getFallbackServices());
          return;
        }

        const data = (await response.json()) as ServiceRecord[];

        if (!Array.isArray(data) || data.length === 0) {
          console.warn("No services from API, using mock data");
          setServices(getFallbackServices());
          return;
        }

        setServices(data.map(normalizeService));
      } catch (err) {
        console.warn("Failed to fetch services, using mock data:", err);
        setServices(getFallbackServices());
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchServices();
  }, []);

  return { services, loading, error };
}
