"use client";
import { useState, useEffect } from "react";
import Layout from "../../components/common/layout";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import ServicesList from "@/components/services/ServicesList";
import Spinner from "@/components/shared/Spinner";

interface Service {
  _id?: string;
  slug: string;
  title: string;
  desc: string;
  details: string;
  image?: string;
  packages: any[];
}

export default function ServiceDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchService = async () => {
      try {
        setLoading(true);
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

        const response = await fetch(`${BACKEND_URL}/api/services/${slug}`);
        
        if (!response.ok) {
          throw new Error("Service not found");
        }

        const data = await response.json();
        setService(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching service:", err);
        setError(err instanceof Error ? err.message : "Failed to load service");
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner />
        </div>
      </Layout>
    );
  }

  if (error || !service) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/services"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-6 transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Services
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">Service Not Found</h1>
            <p className="text-gray-600 mt-2">{error || "The service you're looking for doesn't exist."}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{service.title} | Verdora</title>
      </Head>
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            href="/services"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-6 transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to All Services
          </Link>

          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-green-900 mb-4">
              {service.title}
            </h1>
            <p className="text-lg text-gray-700">{service.details}</p>
          </div>

          {/* Display the service using the reusable component */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-green-700 mb-6">
              Available Packages & Booking
            </h2>
            <ServicesList services={[service]} loading={false} showFullGrid={true} />
          </div>
        </div>
      </Layout>
    </>
  );
}
