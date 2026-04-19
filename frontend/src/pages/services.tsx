"use client";
import React from "react";
import Layout from "../components/common/layout";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Head from "next/head";
import { useRouter } from "next/router";
import { useServices } from "@/hooks/useServices";
import ServicesList from "@/components/services/ServicesList";

export default function Services() {
  const router = useRouter();
  const { services, loading } = useServices();

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

            {/* Services Grid - Using Reusable Component */}
            <ServicesList services={services} loading={loading} showFullGrid={true} />
          </div>
        </div>
      </Layout>
    </>
  );
}
