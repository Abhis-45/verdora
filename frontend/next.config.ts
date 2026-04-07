import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  allowedDevOrigins: ["http://localhost:3000", "https://verdora-two.vercel.app"],
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  productionBrowserSourceMaps: false,
  typescript: {
    // Suppress TypeScript errors in build
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: process.env.NODE_ENV === "production",
    domains: ["images.unsplash.com", "res.cloudinary.com"],
  },
  // Rewrites can have limitations on Vercel, so we call backend directly from client side
  // See: frontend/src/lib/api.ts where BACKEND_URL is used directly
  // Ensure proper handling of trailing slashes
  trailingSlash: false,
};

export default nextConfig;
