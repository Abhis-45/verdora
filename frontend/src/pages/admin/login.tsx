import {
  useState,
} from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Toast from "@/components/shared/Toast";
import PasswordResetModal from "@/components/auth/PasswordResetModal";
import Link from "next/link";
import Layout from "@/components/common/layout";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let data: any;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        setToast({
          message: `Server error: Invalid response. Status: ${response.status}`,
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setToast({
          message: data.message || `Login failed (${response.status})`,
          type: "error",
        });
        return;
      }

      // Store token and role info
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("role", data.admin?.role || "admin");
      localStorage.setItem("adminName", data.admin?.username || "Admin");

      setToast({
        message: "Login successful!",
        type: "success",
      });

      // Route to appropriate dashboard based on role
      if (data.admin?.role === "vendor") {
        setTimeout(() => router.push("/vendor/dashboard"), 1000);
      } else {
        setTimeout(() => router.push("/admin/dashboard"), 1000);
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      setToast({
        message: (error as any)?.message || "Failed to login",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login | Verdora</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center p-4 relative">
          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Verdora Admin
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Sign in to manage products and orders
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="admin@verdora.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-sm text-green-600 hover:text-green-700 mt-2 font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-center text-gray-600 mt-6 text-sm">
              Not an admin?{" "}
              <Link
                href="/"
                className="text-green-600 hover:text-green-700 font-semibold"
              >
                Back to Home
              </Link>
            </p>
          </div>
        </div>
      </Layout>

      <PasswordResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        backendUrl={typeof window !== "undefined" ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com" : "https://verdora.onrender.com"}
      />
    </>
  );
}
