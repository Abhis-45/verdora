"use client";
import React, { useState } from "react";
import Layout from "../components/common/layout";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Head from "next/head";
import servicesData from "../data/services.json";
import { useRouter } from "next/router";
import Image from "next/image";

interface Package {
  id: string;
  name: string;
  desc: string;
  // ❌ removed price
}

interface Service {
  slug: string;
  title: string;
  desc: string;
  details: string;
  packages: Package[];
  image?: string; // ✅ image now comes from JSON
}

export default function Services() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Our Services | Verdora</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-linear-to-b from-green-50 to-white">
          <div className="max-w-7xl mx-auto px-3 sm:px-5 py-6 sm:py-10 md:py-12">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-4 transition text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Hero Section */}
            <div className="text-center mb-10 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-green-600 to-emerald-500 mb-3 tracking-tight">
                Our Services
              </h1>
              <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
                Expert plant care, beautiful homes, and stunning gardens. Let us
                help you create the perfect green space! 🌿
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {servicesData.map((service: Service) => (
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
          </div>
        </div>

        {/* Modal Popup */}
        {selectedService && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
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
                {selectedService.details}
              </p>

              <h3 className="text-md font-semibold text-green-600 mb-2">
                Packages
              </h3>
              <div className="space-y-3">
                {selectedService.packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() =>
                      router.push(
                        `/contact?service=${encodeURIComponent(
                          selectedService.title,
                        )}&package=${encodeURIComponent(pkg.name)}`,
                      )
                    }
                    className="border rounded-md p-3 shadow-sm hover:shadow-md transition cursor-pointer"
                  >
                    <h4 className="text-sm font-bold text-gray-900">
                      {pkg.name}
                    </h4>
                    <p className="text-xs text-gray-600 mb-1">{pkg.desc}</p>
                    <span className="text-xs text-green-700">
                      Click to contact →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
