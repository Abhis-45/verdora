/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import {
  HomeIcon,
  ArrowLeftOnRectangleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/solid";

interface VendorProfile {
  _id: string;
  username: string;
  email: string;
  businessName: string;
  businessDescription: string;
  businessPhone: string;
  businessLocation: string;
  businessWebsite: string;
  vendorName: string;
  mobileNumber: string;
  status: "active" | "inactive";
}

export default function VendorSettings() {
  const router = useRouter();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    businessName: "",
    businessDescription: "",
    businessPhone: "",
    businessLocation: "",
    businessWebsite: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role");

    if (!token || role !== "vendor") {
      router.push("/admin/login");
      return;
    }

    if (token) {
      fetchVendorProfile(token);
    }
  }, [router]);

  const fetchVendorProfile = async (token: string) => {
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const res = await fetch(`${BACKEND_URL}/api/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setProfileForm({
          businessName: data.businessName || "",
          businessDescription: data.businessDescription || "",
          businessPhone: data.businessPhone || "",
          businessLocation: data.businessLocation || "",
          businessWebsite: data.businessWebsite || "",
        });
      } else {
        setProfileMessage("Failed to load profile");
      }
    } catch (err) {
      setProfileMessage(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage("");

    try {
      const token = localStorage.getItem("adminToken");
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const res = await fetch(`${BACKEND_URL}/api/vendor/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        setProfileMessage("✅ Profile updated successfully!");
        if (token) {
          fetchVendorProfile(token);
        }
      } else {
        const data = await res.json();
        setProfileMessage(`❌ ${data.message || "Failed to update profile"}`);
      }
    } catch (err) {
      setProfileMessage(`❌ Error: ${err}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("❌ New passwords do not match");
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage("❌ Password must be at least 6 characters");
      setPasswordLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const res = await fetch(`${BACKEND_URL}/api/vendor/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      if (res.ok) {
        setPasswordMessage("✅ Password updated successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const data = await res.json();
        setPasswordMessage(`❌ ${data.message || "Failed to update password"}`);
      }
    } catch (err) {
      setPasswordMessage(`❌ Error: ${err}`);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Vendor Settings | Verdora</title>
        <meta name="description" content="Manage your vendor account settings" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white shadow-lg">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">⚙️ Account Settings</h1>
                <p className="text-emerald-100 mt-1">
                  Manage your profile and security
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/vendor/dashboard")}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  <HomeIcon className="w-5 h-5" /> Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                >
                  <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === "profile"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              👤 Profile Information
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === "password"
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <LockClosedIcon className="w-5 h-5 inline mr-2" /> Change Password
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Business Information
                </h2>
                <p className="text-gray-600">
                  Update your business details
                </p>
              </div>

              {profileMessage && (
                <div
                  className={`mb-6 rounded-lg p-4 ${
                    profileMessage.includes("✅")
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {profileMessage}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={profileForm.businessName}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Your business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Description
                  </label>
                  <textarea
                    name="businessDescription"
                    value={profileForm.businessDescription}
                    onChange={handleProfileChange}
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Tell customers about your business"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      name="businessPhone"
                      value={profileForm.businessPhone}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Location
                    </label>
                    <input
                      type="text"
                      name="businessLocation"
                      value={profileForm.businessLocation}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      placeholder="City/Location"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Website (Optional)
                  </label>
                  <input
                    type="url"
                    name="businessWebsite"
                    value={profileForm.businessWebsite}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {profileLoading ? "Saving..." : "💾 Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Change Password
                </h2>
                <p className="text-gray-600">
                  Update your login password to keep your account secure
                </p>
              </div>

              {passwordMessage && (
                <div
                  className={`mb-6 rounded-lg p-4 ${
                    passwordMessage.includes("✅")
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {passwordMessage}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    placeholder="Confirm your new password"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                  <p className="font-semibold mb-2">🔒 Password Requirements:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Minimum 6 characters long</li>
                    <li>Mix of uppercase and lowercase letters recommended</li>
                    <li>Include numbers and symbols for better security</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {passwordLoading ? "Updating..." : "🔐 Update Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vendor Info Card */}
          <div className="mt-8 bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
            <h3 className="font-bold text-emerald-900 mb-4">👤 Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Username:</p>
                <p className="font-semibold text-gray-900">{profile?.username}</p>
              </div>
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="font-semibold text-gray-900">{profile?.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Account Status:</p>
                <p className={`font-semibold ${profile?.status === "active" ? "text-green-600" : "text-red-600"}`}>
                  {profile?.status === "active" ? "✅ Active" : "❌ Inactive"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Vendor Name:</p>
                <p className="font-semibold text-gray-900">{profile?.vendorName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
