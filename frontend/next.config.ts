import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  allowedDevOrigins: ["http://localhost:3000"],
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
    domains: ["images.unsplash.com", "res.cloudinary.com"],
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: "http://localhost:5000/api/:path*",
        },
      ],
    };
  },
  env: {
    NEXT_PUBLIC_API_URL: "/api",
  },
};

export default nextConfig;
