"use client";
import React, { useState, useEffect } from "react";
import Layout from "../components/common/layout";
import Head from "next/head";
import Toast from "../components/shared/Toast";
import { useRouter } from "next/router";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

interface User {
  name?: string;
  email?: string;
}

export default function Contact() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    service: "",
    package: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // ✅ Prefill message with formal email + table
  useEffect(() => {
    if (router.query.service && router.query.package) {
      setFormData((prev) => ({
        ...prev,
        service: String(router.query.service),
        package: String(router.query.package),
        message: `Dear Verdora Team,

I am interested in your ${router.query.service} service, specifically the "${router.query.package}" package. Could you please provide me with a detailed quotation based on the scope, quality, and quantity of the service?

Please find below the product, quantity, and service needs:

| Category      | Details             |
|---------------|---------------------|
| Products      | --- ADD DETAILS --- |
| Quantity      | --- ADD DETAILS --- |
| Service Needs | --- ADD DETAILS --- |

I would appreciate it if you could share a detailed quotation at your earliest convenience.

Best regards,
${prev.name || "Your Name"}`,
      }));
    }
  }, [router.query]);

  // ✅ Prefill name/email if user is logged in (optional)
  useEffect(() => {
    // Try to get user from context or localStorage
    try {
      const userToken = localStorage.getItem("userToken");
      if (userToken) {
        // If user is logged in, prefill their details
        const userData = localStorage.getItem("userData");
        if (userData) {
          const user = JSON.parse(userData);
          setFormData((prev) => ({
            ...prev,
            name: user.name || prev.name,
            email: user.email || prev.email,
          }));
        }
      }
    } catch (err) {
      // Silent fail - allow anonymous submissions
    }
  }, []);

  return (
    <>
      <Head>
        <title>Contact Us | Verdora</title>
        <meta
          name="description"
          content="Contact Verdora for gardening services and inquiries."
        />
      </Head>
      <Layout>
        <main className="min-h-screen bg-linear-to-b from-white to-green-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-green-700 hover:text-green-800 font-medium mb-6 transition text-sm"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            {/* Hero Heading */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-green-700 to-emerald-500 tracking-tight">
                Get in Touch
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Share your requirements and request a quotation.
              </p>
            </div>

            {/* Contact Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!formData.name || !formData.email || !formData.phone || !formData.message) {
                  setToast({
                    message: "Please fill in all fields",
                    type: "error",
                  });
                  return;
                }
                setIsLoading(true);
                try {
                  const BACKEND_URL =
                    typeof window !== "undefined"
                      ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
                      : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
                  const res = await fetch(`${BACKEND_URL}/api/contact`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...formData,
                      type: formData.service ? "service" : "general",
                      servicePackage: formData.package,
                    }),
                  });
                  if (res.ok) {
                    setToast({
                      message: formData.package
                        ? `Your request for ${formData.package} (${formData.service}) has been sent successfully!`
                        : "Message sent successfully! We'll get back to you soon.",
                      type: "success",
                    });
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      message: "",
                      service: "",
                      package: "",
                    });
                  }
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (err) {
                  // Silently fail
                } finally {
                  setIsLoading(false);
                }
              }}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-5"
            >
              {/* Hidden fields */}
              <input type="hidden" value={formData.service} name="service" />
              <input type="hidden" value={formData.package} name="package" />

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-green-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-green-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-green-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Your phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-green-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={10}
                  placeholder="Write your message..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                ></textarea>
              </div>

              {/* Submit */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-2 text-sm bg-linear-to-r from-green-600 to-emerald-500 text-white font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </main>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </Layout>
    </>
  );
}
