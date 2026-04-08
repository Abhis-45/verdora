/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Layout from "../../components/common/layout";

export default function AdminRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "vendor",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "admin") {
      router.push("/admin/login");
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("All fields are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Register | Verdora</title>
      </Head>
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
              🔑 Register Account
            </h1>
            <p className="text-center text-sm text-gray-600 mb-6">
              Admin Only - Register new vendors or admins
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vendor">Vendor (Can sell products)</option>
                  <option value="admin">Admin (Can manage marketplace)</option>
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                <p className="font-semibold mb-2">Role Differences:</p>
                <ul className="space-y-1 text-xs pl-4">
                  <li>
                    • <strong>Vendor:</strong> Self-register, manage own
                    products
                  </li>
                  <li>
                    • <strong>Admin:</strong> Manage all products and vendors
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Registering..." : "Register Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm">
              <a
                href="/admin/dashboard"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Back to Dashboard
              </a>
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}
