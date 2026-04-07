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
    domains: ["images.unsplash.com", "res.cloudinary.com"],
  },
  rewrites: async () => {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
