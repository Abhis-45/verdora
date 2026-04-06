/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { useState, useEffect } from "react";
import servicesData from "../../data/services.json";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";

interface Package {
  id: string;
  name: string;
  desc: string;
}

interface Service {
  slug: string;
  title: string;
  desc: string;
  details: string;
  packages: Package[];
  image?: string;
}

export default function ServicesPreview() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (servicesData && servicesData.length > 0) setLoading(false);
  }, []);

  return (
    <section className="mb-8 sm:mb-10">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-green-700 flex justify-between items-center">
        Our Services
        <Link
          href="/services"
          className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base flex gap-1 items-center transition"
        >
          View All
          <ArrowRightCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>
      </h2>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-lg shimmer" />
          ))}
        </div>
      ) : (
        <>
          {/* Mobile/Tablet Swiper */}
          <div className="block lg:hidden">
            <Swiper
              modules={[Pagination, Autoplay]}
              slidesPerView={1.15}
              spaceBetween={12}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              breakpoints={{
                640: { slidesPerView: 2.3 },
                768: { slidesPerView: 3 },
              }}
              className="-mx-4 px-4 custom-swiper"
            >
              {servicesData.map((service: Service) => (
                <SwiperSlide key={service.slug}>
                  <div
                    className="relative h-40 sm:h-48 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden group"
                    onClick={() => setSelectedService(service)}
                  >
                    <Image
                      src={service.image || "/images/placeholder.jpg"}
                      alt={service.title}
                      fill
                      className="object-cover transform transition-transform duration-700 ease-in-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                      <h3 className="text-base sm:text-lg font-semibold drop-shadow-md">
                        {service.title}
                      </h3>
                      <p className="text-xs sm:text-sm mt-1 line-clamp-2 drop-shadow-md">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop Grid */}
          <div className="hidden lg:grid grid-cols-3 gap-6">
            {servicesData.map((service: Service) => (
              <div
                key={service.slug}
                className="relative h-40 sm:h-48 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden group"
                onClick={() => setSelectedService(service)}
              >
                <Image
                  src={service.image || "/images/placeholder.jpg"}
                  alt={service.title}
                  fill
                  className="object-cover transform transition-transform duration-700 ease-in-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                  <h3 className="text-base sm:text-lg font-semibold drop-shadow-md">
                    {service.title}
                  </h3>
                  <p className="text-xs sm:text-sm mt-1 line-clamp-2 drop-shadow-md">
                    {service.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Popup for Packages */}
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
    </section>
  );
}
