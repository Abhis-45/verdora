/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import Link from "next/link";
import { ArrowRightCircleIcon } from "@heroicons/react/24/solid";
import { useServices } from "@/hooks/useServices";
import ServicesList from "@/components/services/ServicesList";

export default function ServicesPreview() {
  const { services, loading } = useServices();

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

      {/* Services Grid - Using Reusable Component */}
      <ServicesList services={services} loading={loading} showFullGrid={false} />
    </section>
  );
}
