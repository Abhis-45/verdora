"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../../components/common/layout";

export default function VendorLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Verify the role is vendor
        if (data.admin?.role === "vendor") {
          localStorage.setItem("adminToken", data.token);
          localStorage.setItem("role", data.admin.role);
          localStorage.setItem("adminName", data.admin?.username || "Vendor");
          router.push("/vendor/dashboard");
        } else {
          setError("Account is not a vendor account. Please use admin login.");
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Vendor Login | Verdora</title>
      </Head>
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-center text-green-700 mb-8">
              🌱 Vendor Login
            </h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Vendor Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/vendor/signup"
                className="text-green-600 hover:text-green-700 font-semibold"
              >
                Sign Up as Vendor
              </Link>
            </p>

            <p className="mt-4 text-center text-sm text-gray-600">
              <Link
                href="/admin/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Admin? Login here
              </Link>
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}
