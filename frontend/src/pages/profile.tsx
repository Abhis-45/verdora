"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/common/layout";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Head from "next/head";
import { Address, UserProfile } from "@/types/user";
import Spinner from "@/components/shared/Spinner";
import AuthPopup from "@/components/auth/AuthPop";
import { ensurePlus91 } from "@/utils/phone";
import { useUser } from "@/context/UserContext";
import { PincodeData } from "@/utils/pincodeApi";
import { getCurrentLocationWithAddress } from "@/utils/geolocation";
import { PincodeSuggestions } from "@/components/forms/PincodeSuggestions";
import {
  saveSelectedAddressId,
  getLastDeliveryLocation,
} from "@/utils/deliveryDataManager";

export default function ProfilePage() {
  const router = useRouter();
  const { forceLogout } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: string;
    msg: string;
  } | null>(null);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editField, setEditField] = useState<"name" | "gender" | "dob" | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    name: "",
    phone: "",
    isDefault: false,
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordOtpStep, setPasswordOtpStep] = useState<"request" | "verify">(
    "request",
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordOtp, setPasswordOtp] = useState("");

  // Email/mobile update with OTP
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailOtpStep, setEmailOtpStep] = useState<"request" | "verify">(
    "request",
  );
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");

  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileOtpStep, setMobileOtpStep] = useState<"request" | "verify">(
    "request",
  );
  const [newMobile, setNewMobile] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState("");

  // Fetch profile on mount
  useEffect(() => {
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!storedToken) {
      // Show auth popup instead of blocking
      setShowAuthPopup(true);
      setLoading(false);
      return;
    }
    setToken(storedToken);
    fetchProfile(storedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async (authToken: string) => {
    try {
      setError(null);
      const timeoutMs = 15000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Request timeout - taking too long to load")),
          timeoutMs,
        ),
      );

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const fetchPromise = fetch(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const res = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (res.status === 401) {
        forceLogout();
        setError(null);
        setProfile(null);
        setShowAuthPopup(true);
        setLoading(false);
        return;
      }

      if (res.status === 404) {
        setError("Profile not found");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      if (!data || Object.keys(data).length === 0) {
        throw new Error("No profile data received");
      }

      setProfile(data);
      setError(null);
      // Set default address as selected
      const defaultAddr = data.addresses?.find(
        (a: unknown) => (a as Address).isDefault,
      );
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr._id);
      }

      // If no default address in profile, try to load from localStorage
      if (!defaultAddr && (!data.addresses || data.addresses.length === 0)) {
        const savedLocation = getLastDeliveryLocation();
        if (savedLocation) {
          // Pre-fill the address form with saved location for quick re-entry
          setAddressForm((current) => ({
            ...current,
            pincode: savedLocation.pincode,
            city: savedLocation.city,
            state: savedLocation.state,
            address:
              savedLocation.area ||
              `${savedLocation.city}, ${savedLocation.state}`,
          }));
        }
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to load profile. Please try again.";
      setError(errorMsg);
      console.error("Profile fetch error:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateField = async (field: string, value: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/profile/update-field`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ field, value }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setFeedback({ type: "success", msg: "Updated successfully" });
        setShowEditModal(false);
      } else {
        setFeedback({ type: "error", msg: data.message });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update field";
      setFeedback({ type: "error", msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateAddress = async () => {
    if (!token || !addressForm.address) return;
    setLoading(true);
    try {
      const method = editingAddressId ? "PATCH" : "POST";
      const endpoint = editingAddressId
        ? `/api/profile/address/${editingAddressId}`
        : `/api/profile/address`;

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const url = `${BACKEND_URL}${endpoint}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile!, addresses: data.addresses });
        setFeedback({
          type: "success",
          msg: editingAddressId ? "Address updated" : "Address added",
        });
        setShowAddressModal(false);
        setAddressForm({
          label: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          name: "",
          phone: "",
          isDefault: false,
        });
        setEditingAddressId(null);
      } else {
        setFeedback({ type: "error", msg: data.message });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to add/update address";
      setFeedback({ type: "error", msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/profile/address/${addressId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setProfile({ ...profile!, addresses: data.addresses });
        setFeedback({ type: "success", msg: "Address deleted" });
      } else {
        setFeedback({ type: "error", msg: data.message });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete address";
      setFeedback({ type: "error", msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/profile/address/${addressId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (res.ok) {
        // Save address ID to localStorage for persistence
        saveSelectedAddressId(addressId);
        setProfile({ ...profile!, addresses: data.addresses });
        setSelectedAddressId(addressId);
        setFeedback({ type: "success", msg: "Default address set" });
      } else {
        setFeedback({ type: "error", msg: data.message });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to set default address";
      setFeedback({ type: "error", msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (addressId: string) => {
    // Optimistic UI update then persist
    setSelectedAddressId(addressId);
    setDefaultAddress(addressId);
  };

  const chooseDeliveryAddress = () => {
    if (!selectedAddressId) {
      setFeedback({ type: "error", msg: "Select an address first" });
      return;
    }
    // store for checkout use
    if (typeof window !== "undefined") {
      localStorage.setItem("deliveryAddressId", selectedAddressId);
    }
    // Redirect to cart page
    router.push("/cart");
  };

  const handleGetCurrentLocationForAddress = async () => {
    setAddressLoading(true);
    setAddressError(null);
    try {
      const result = await getCurrentLocationWithAddress();
      if (result) {
        const { address } = result;
        setAddressForm((current) => ({
          ...current,
          city: address.city || current.city,
          state: address.state || current.state,
          address: address.area || current.address,
        }));
      } else {
        setAddressError(
          "Could not get your location. Please enable location services.",
        );
      }
    } catch (err) {
      setAddressError("Error getting current location");
      console.error(err);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressPincodeSuggestionSelect = (data: PincodeData) => {
    console.log("✅ Profile: Pincode suggestion selected:", data);
    setAddressForm((current) => ({
      ...current,
      pincode: data.pincode,
      city: data.city || current.city,
      state: data.state || current.state,
      address: current.address || data.area || data.city,
    }));
    setAddressError(null);
    setAddressLoading(false);
  };

  const updatePassword = async (withOtp: boolean = false) => {
    if (!token) return;
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", msg: "Passwords don't match" });
      return;
    }
    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/profile/update-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword: newPassword,
          otp: withOtp ? passwordOtp : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", msg: "Password updated" });
        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
        setPasswordOtp("");
        setPasswordOtpStep("request");
      } else {
        setFeedback({ type: "error", msg: data.message });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update password";
      setFeedback({ type: "error", msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (
    field: "email" | "mobile" | "password" | "delete",
    newValue?: string,
  ) => {
    if (!token) return;
    setLoading(true);
    try {
      const body: { field: string; newValue?: string } = { field };
      if (newValue)
        body.newValue = field === "mobile" ? ensurePlus91(newValue) : newValue;

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/profile/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", msg: data.message });
        if (field === "email") setEmailOtpStep("verify");
        if (field === "mobile") setMobileOtpStep("verify");
        if (field === "password") setPasswordOtpStep("verify");
      } else {
        setFeedback({ type: "error", msg: data.message });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to send OTP";
      setFeedback({ type: "error", msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpUpdate = async (field: "email" | "mobile") => {
    if (!token) return;
    setLoading(true);
    try {
      const newValueRaw = field === "email" ? newEmail : newMobile;
      const newValue =
        field === "mobile" ? ensurePlus91(newValueRaw) : newValueRaw;
      const otp = field === "email" ? emailOtp : mobileOtp;

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const res = await fetch(`${BACKEND_URL}/api/profile/verify-otp-update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ field, otp, newValue }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.user);
        setFeedback({ type: "success", msg: `${field} updated` });
        if (field === "email") {
          setShowEmailModal(false);
          setNewEmail("");
          setEmailOtp("");
          setEmailOtpStep("request");
        } else {
          setShowMobileModal(false);
          setNewMobile("");
          setMobileOtp("");
          setMobileOtpStep("request");
        }
      } else {
        setFeedback({ type: "error", msg: data.message });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to verify OTP";
      setFeedback({ type: "error", msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const res = await fetch(`${BACKEND_URL}/api/profile/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: deleteOtp }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
      } else {
        setFeedback({ type: "error", msg: data.message });
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete account";
      setFeedback({ type: "error", msg: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleAuthClose = () => {
    setShowAuthPopup(false);
    router.replace("/");
  };

  const handleAuthLogin = () => {
    setShowAuthPopup(false);
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (storedToken) {
      setToken(storedToken);
      setLoading(true);
      fetchProfile(storedToken);
    }
  };

  if (showAuthPopup) {
    return (
      <Layout>
        <AuthPopup
          onClose={handleAuthClose}
          onLogin={handleAuthLogin}
          initialMessage={"Please sign in to access your profile"}
          initialType={"error"}
        />
      </Layout>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile | Verdora</title>
      </Head>
      <Layout>
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold mb-6 transition"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center min-h-screen">
              <Spinner />
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto text-center py-12">
              <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : !profile ? (
            <div className="max-w-md mx-auto text-center py-12">
              <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 font-semibold mb-4">
                  No profile data available
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Reload Profile
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Feedback */}
              {feedback && (
                <div
                  className={`mb-4 p-3 rounded ${
                    feedback.type === "error"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {feedback.msg}
                </div>
              )}

              {/* Desktop Layout */}
              <div className="hidden xl:grid grid-cols-2 gap-6">
                {/* Left: Personal Info */}
                <div className="col-span-1 bg-white p-6 rounded-xl border border-gray-200">
                  <h2 className="text-xl font-bold mb-5 text-green-900">
                    My Profile
                  </h2>

                  <div className="space-y-5">
                    {/* Name */}
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs text-gray-500">Name</label>
                        <p className="font-semibold text-gray-900">
                          {profile.name}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditField("name");
                          setEditValue(profile.name || "");
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Gender */}
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs text-gray-500">Gender</label>
                        <p className="font-semibold capitalize text-gray-900">
                          {profile.gender || "-"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditField("gender");
                          setEditValue(profile.gender || "");
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* DOB */}
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs text-gray-500">
                          Date of Birth
                        </label>
                        <p className="font-semibold text-gray-900">
                          {profile.dob
                            ? new Date(profile.dob).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditField("dob");
                          setEditValue(
                            profile.dob ? profile.dob.substring(0, 10) : "",
                          );
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <hr className="my-4 border-gray-200" />

                    {/* Email */}
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs text-gray-500">Email</label>
                        <p className="font-semibold text-sm text-gray-900">
                          {profile.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNewEmail("");
                          setEmailOtp("");
                          setEmailOtpStep("request");
                          setShowEmailModal(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Mobile */}
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="text-xs text-gray-500">Mobile</label>
                        <p className="font-semibold text-gray-900">
                          {profile.mobile}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setNewMobile("");
                          setMobileOtp("");
                          setMobileOtpStep("request");
                          setShowMobileModal(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex gap-3">
                    {/* Update Password */}
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="flex-1 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition"
                    >
                      Update Password
                    </button>

                    {/* Logout */}
                    <button
                      onClick={logout}
                      className="flex-1 py-2.5 rounded-lg bg-linear-to-r from-red-500 to-red-600 text-white font-medium flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 transition"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Logout
                    </button>

                    {/* Delete Account */}
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex-1 py-2.5 rounded-lg bg-linear-to-r from-gray-700 to-gray-800 text-white font-medium hover:from-gray-800 hover:to-black transition"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>

                {/* Right: Addresses */}
                <div className="col-span-1 bg-white p-6 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-bold text-green-900">
                      Addresses
                    </h3>
                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressForm({
                          label: "",
                          address: "",
                          city: "",
                          state: "",
                          pincode: "",
                          name: "",
                          phone: "",
                          isDefault: false,
                        });
                        setShowAddressModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <div className="space-y-4">
                    {profile.addresses && profile.addresses.length > 0 ? (
                      profile.addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className="p-4 border border-gray-200 rounded-lg flex items-start gap-4"
                        >
                          <input
                            type="radio"
                            name="address"
                            value={addr._id}
                            checked={selectedAddressId === addr._id}
                            onChange={() => handleSelectAddress(addr._id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-900">
                              {addr.label}
                            </h4>
                            {addr.name && (
                              <p className="text-sm text-gray-600 mt-1">
                                👤 {addr.name}
                              </p>
                            )}
                            {addr.phone && (
                              <p className="text-sm text-gray-600">
                                📱 {addr.phone}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 mt-1">
                              {addr.address}
                            </p>
                            <p className="text-sm text-gray-600">
                              {addr.city}, {addr.state} {addr.pincode}
                            </p>
                            {addr.isDefault && (
                              <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingAddressId(addr._id);
                                setAddressForm(addr);
                                setShowAddressModal(true);
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => deleteAddress(addr._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No addresses added yet.</p>
                    )}
                  </div>

                  {selectedAddressId && (
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={chooseDeliveryAddress}
                        className="flex items-center gap-1 text-green-600 font-medium hover:text-green-700 transition"
                      >
                        Proceed to Cart →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Tablet & Mobile Layout */}
              <div className="xl:hidden space-y-6">
                {/* Personal Info Card */}
                <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 text-green-900">
                    My Profile
                  </h2>

                  <div className="space-y-4">
                    {/* Name */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Name</span>
                      <span className="font-semibold text-gray-900">
                        {profile.name}
                      </span>
                      <button
                        onClick={() => {
                          setEditField("name");
                          setEditValue(profile.name || "");
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Email */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Email</span>
                      <span className="font-semibold text-sm text-gray-900">
                        {profile.email}
                      </span>
                      <button
                        onClick={() => {
                          setNewEmail("");
                          setEmailOtp("");
                          setEmailOtpStep("request");
                          setShowEmailModal(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Mobile */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Mobile</span>
                      <span className="font-semibold text-gray-900">
                        {profile.mobile}
                      </span>
                      <button
                        onClick={() => {
                          setNewMobile("");
                          setMobileOtp("");
                          setMobileOtpStep("request");
                          setShowMobileModal(true);
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex gap-2">
                    {/* Change Password */}
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="flex-1 py-2 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition"
                    >
                      Change Password
                    </button>

                    {/* Logout */}
                    <button
                      onClick={logout}
                      className="flex-1 py-2 rounded-lg bg-linear-to-r from-red-500 to-red-600 text-white text-sm font-medium flex items-center justify-center gap-1 hover:from-red-600 hover:to-red-700 transition"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Logout
                    </button>

                    {/* Delete Account */}
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex-1 py-2 rounded-lg bg-linear-to-r from-gray-700 to-gray-800 text-white text-sm font-medium hover:from-gray-800 hover:to-black transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Addresses Card */}
                <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-green-900">
                      Addresses
                    </h3>
                    <button
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressForm({
                          label: "",
                          address: "",
                          city: "",
                          state: "",
                          pincode: "",
                          name: "",
                          phone: "",
                          isDefault: false,
                        });
                        setShowAddressModal(true);
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium transition"
                    >
                      <PlusIcon className="h-4 w-4 inline" /> Add
                    </button>
                  </div>

                  {/* Address List */}
                  <div className="space-y-3">
                    {profile.addresses && profile.addresses.length > 0 ? (
                      profile.addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className="p-3 border border-gray-200 rounded-lg text-sm flex items-start gap-3 transition hover:-translate-y-0.5"
                        >
                          <input
                            type="radio"
                            name="address"
                            value={addr._id}
                            checked={selectedAddressId === addr._id}
                            onChange={() => handleSelectAddress(addr._id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-green-900 mb-1">
                              {addr.label}
                            </div>
                            {addr.name && (
                              <p className="text-xs text-gray-600">👤 {addr.name}</p>
                            )}
                            {addr.phone && (
                              <p className="text-xs text-gray-600">📱 {addr.phone}</p>
                            )}
                            <p className="text-gray-600">{addr.address}</p>
                            <p className="text-gray-600">
                              {addr.city}, {addr.state} {addr.pincode}
                            </p>
                            {addr.isDefault && (
                              <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => {
                                setEditingAddressId(addr._id);
                                setAddressForm(addr);
                                setShowAddressModal(true);
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteAddress(addr._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 text-sm">
                        No addresses added yet.
                      </p>
                    )}

                    {/* Proceed Link */}
                    {selectedAddressId && (
                      <div className="mt-4 flex justify-end border-t border-gray-200 pt-3">
                        <button
                          onClick={chooseDeliveryAddress}
                          className="flex items-center gap-1 text-green-600 font-medium hover:text-green-700 transition"
                        >
                          Proceed to Cart <span className="text-lg">→</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Field Modal */}
              {showEditModal && editField && (
                <div className="app-modal-shell">
                  <div className="app-modal-card w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl sm:p-6">
                    <h3 className="text-lg font-bold mb-4 capitalize">
                      Edit {editField}
                    </h3>
                    {editField === "gender" ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-2 border rounded mb-4"
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : editField === "dob" ? (
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-2 border rounded mb-4"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full p-2 border rounded mb-4"
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateField(editField, editValue)}
                        disabled={loading}
                        className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setShowEditModal(false)}
                        className="flex-1 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Update Modal */}
              {showPasswordModal && (
                <div className="app-modal-shell">
                  <div className="app-modal-card w-full max-w-sm rounded-lg bg-green-900 p-5 shadow-2xl sm:p-6">
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-xl"
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-white">
                      Update Password
                    </h3>

                    {passwordOtpStep === "request" ? (
                      <>
                        <input
                          type="password"
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-3 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                          type="password"
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-4 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => sendOtp("password")}
                          disabled={
                            loading ||
                            !newPassword ||
                            !confirmPassword ||
                            newPassword !== confirmPassword
                          }
                          className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {loading ? "Sending..." : "Send OTP"}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-300 mb-3">
                          OTP sent to your email and mobile
                        </p>
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={passwordOtp}
                          onChange={(e) => {
                            const cleaned = e.target.value
                              .split("")
                              .filter((c) => c >= "0" && c <= "9")
                              .join("")
                              .slice(0, 6);
                            setPasswordOtp(cleaned);
                          }}
                          maxLength={6}
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-4 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => updatePassword(true)}
                          disabled={loading || passwordOtp.length < 6}
                          className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {loading ? "Updating..." : "Verify & Update"}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setShowPasswordModal(false);
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordOtp("");
                        setPasswordOtpStep("request");
                      }}
                      className="w-full mt-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Address Modal */}
              {showAddressModal && (
                <div className="app-modal-shell">
                  <div className="app-modal-card w-full max-w-sm rounded-lg bg-green-900 p-5 shadow-2xl sm:p-6">
                    <button
                      onClick={() => setShowAddressModal(false)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-xl"
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-white">
                      {editingAddressId ? "Edit Address" : "Add Address"}
                    </h3>

                    {/* Error Message */}
                    {addressError && (
                      <div className="mb-3 p-2 bg-red-600 text-red-100 rounded text-sm">
                        {addressError}
                      </div>
                    )}

              <input
                type="text"
                placeholder="Label (e.g., Home, Office)"
                value={addressForm.label}
                onChange={(e) =>
                  setAddressForm({
                    ...addressForm,
                    label: e.target.value,
                  })
                }
                disabled={addressLoading}
                className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-3 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-700"
              />

              <input
                type="text"
                placeholder="Name"
                value={addressForm.name}
                onChange={(e) =>
                  setAddressForm({
                    ...addressForm,
                    name: e.target.value,
                  })
                }
                disabled={addressLoading}
                className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-3 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-700"
              />

              <input
                type="text"
                placeholder="Phone Number"
                value={addressForm.phone}
                onChange={(e) =>
                  setAddressForm({
                    ...addressForm,
                    phone: e.target.value,
                  })
                }
                disabled={addressLoading}
                className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-3 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-700"
              />

                    {/* Pincode Input with Current Location Button */}
                    <div className="mb-3">
                      <PincodeSuggestions
                        onSelect={handleAddressPincodeSuggestionSelect}
                        placeholder="Enter 6-digit pincode"
                        inputClassName="bg-gray-800 text-white border-gray-600 focus:ring-green-500"
                      />
                    </div>
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={handleGetCurrentLocationForAddress}
                        disabled={addressLoading}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-700 transition font-semibold"
                        title="Use current location"
                      >
                        {addressLoading
                          ? "Getting location..."
                          : "📍 Use My Current Location"}
                      </button>
                    </div>

                    {addressLoading && (
                      <p className="text-xs text-blue-300 mb-2">
                        Fetching location...
                      </p>
                    )}

                    <input
                      type="text"
                      placeholder="Address"
                      value={addressForm.address}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          address: e.target.value,
                        })
                      }
                      disabled={addressLoading}
                      className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-3 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-700"
                    />

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            city: e.target.value,
                          })
                        }
                        disabled={addressLoading}
                        className="p-2 sm:p-3 text-sm sm:text-base border rounded text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-700"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={addressForm.state}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            state: e.target.value,
                          })
                        }
                        disabled={addressLoading}
                        className="p-2 sm:p-3 text-sm sm:text-base border rounded text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-700"
                      />
                    </div>

                    <p className="mb-2 text-xs text-green-100">
                      Enter a 6-digit pincode to auto-fill city and state.
                    </p>

                    <label className="flex items-center gap-2 mb-4 text-white">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            isDefault: e.target.checked,
                          })
                        }
                        disabled={addressLoading}
                      />
                      <span className="text-sm">Set as default</span>
                    </label>

                    <button
                      onClick={addOrUpdateAddress}
                      disabled={loading || addressLoading}
                      className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                      {editingAddressId ? "Update" : "Add"}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddressModal(false);
                        setAddressError(null);
                      }}
                      className="w-full mt-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Email Update Modal */}
              {showEmailModal && (
                <div className="app-modal-shell">
                  <div className="app-modal-card w-full max-w-sm rounded-lg bg-green-900 p-5 shadow-2xl sm:p-6">
                    <button
                      onClick={() => setShowEmailModal(false)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-xl"
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-white">
                      Update Email
                    </h3>

                    {emailOtpStep === "request" ? (
                      <>
                        <input
                          type="email"
                          placeholder="New Email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-4 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => sendOtp("email", newEmail)}
                          disabled={loading || !newEmail}
                          className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {loading ? "Sending..." : "Send OTP"}
                        </button>
                        <button
                          onClick={() => setShowEmailModal(false)}
                          className="w-full mt-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-300 mb-3">
                          OTP sent to your email and mobile
                        </p>
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={emailOtp}
                          onChange={(e) => {
                            const cleaned = e.target.value
                              .split("")
                              .filter((c) => c >= "0" && c <= "9")
                              .join("")
                              .slice(0, 6);
                            setEmailOtp(cleaned);
                          }}
                          maxLength={6}
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-4 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => verifyOtpUpdate("email")}
                          disabled={loading || !emailOtp || emailOtp.length < 6}
                          className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {loading ? "Verifying..." : "Verify & Update"}
                        </button>
                        <button
                          onClick={() => setShowEmailModal(false)}
                          className="w-full mt-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Update Modal */}
              {showMobileModal && (
                <div className="app-modal-shell">
                  <div className="app-modal-card w-full max-w-sm rounded-lg bg-green-900 p-5 shadow-2xl sm:p-6">
                    <button
                      onClick={() => setShowMobileModal(false)}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-xl"
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-white">
                      Update Mobile
                    </h3>

                    {mobileOtpStep === "request" ? (
                      <>
                        <input
                          type="tel"
                          placeholder="New Mobile (with +91)"
                          value={newMobile}
                          onChange={(e) => setNewMobile(e.target.value)}
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-4 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => sendOtp("mobile", newMobile)}
                          disabled={loading || !newMobile}
                          className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {loading ? "Sending..." : "Send OTP"}
                        </button>
                        <button
                          onClick={() => setShowMobileModal(false)}
                          className="w-full mt-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-300 mb-3">
                          OTP sent to your email and mobile
                        </p>
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={mobileOtp}
                          onChange={(e) => {
                            const cleaned = e.target.value
                              .split("")
                              .filter((c) => c >= "0" && c <= "9")
                              .join("")
                              .slice(0, 6);
                            setMobileOtp(cleaned);
                          }}
                          maxLength={6}
                          className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-4 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => verifyOtpUpdate("mobile")}
                          disabled={
                            loading || !mobileOtp || mobileOtp.length < 6
                          }
                          className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {loading ? "Verifying..." : "Verify & Update"}
                        </button>
                        <button
                          onClick={() => setShowMobileModal(false)}
                          className="w-full mt-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Delete Account Modal */}
              {showDeleteModal && (
                <div className="app-modal-shell">
                  <div className="app-modal-card w-full max-w-sm rounded-lg bg-green-900 p-5 shadow-2xl sm:p-6">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteOtp("");
                      }}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-xl"
                      aria-label="close-delete-modal"
                    >
                      ✕
                    </button>
                    <h3 className="text-lg font-bold mb-4 text-red-400">
                      Delete Account
                    </h3>
                    <p className="text-sm text-gray-300 mb-4">
                      This action cannot be undone. Enter OTP sent to your email
                      to confirm.
                    </p>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={deleteOtp}
                      onChange={(e) => {
                        const cleaned = e.target.value
                          .split("")
                          .filter((c) => c >= "0" && c <= "9")
                          .join("")
                          .slice(0, 6);
                        setDeleteOtp(cleaned);
                      }}
                      maxLength={6}
                      className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mb-4 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => sendOtp("delete")}
                        disabled={loading}
                        className="w-full mb-2 py-2 sm:py-3 text-sm sm:text-base bg-yellow-600 text-white rounded hover:bg-yellow-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        {loading ? "Sending..." : "Send OTP"}
                      </button>
                      <button
                        onClick={deleteAccount}
                        disabled={loading || deleteOtp.length < 6}
                        className="w-full py-2 sm:py-3 text-sm sm:text-base bg-red-600 text-white rounded hover:bg-red-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                      >
                        {loading ? "Deleting..." : "Delete Account"}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteModal(false);
                          setDeleteOtp("");
                        }}
                        className="w-full mt-2 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </>
  );
}
