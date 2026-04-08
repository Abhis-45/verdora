/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import ProductsTable from "@/components/admin/ProductsTable";
import Toast from "@/components/shared/Toast";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (error) {
      setToast({ message: "Failed to load products", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to delete product");
      setToast({ message: "Product deleted successfully", type: "success" });
      fetchProducts();
    } catch (error: unknown) {
      setToast({
        message: (error as any)?.message || "Failed to delete product",
        type: "error",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/admin/login");
  };

  return (
    <>
      <Head>
        <title>Admin Products | Verdora</title>
      </Head>
      <div className="min-h-screen bg-gray-100 md:flex">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Sidebar */}
        <Sidebar className="hidden md:flex md:min-h-screen md:shrink-0" />
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div onClick={(event) => event.stopPropagation()}>
              <Sidebar
                className="h-full max-w-[85vw] shadow-2xl"
                onLinkClick={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <Header
            onLogout={handleLogout}
            onToggleSidebar={() => setSidebarOpen(true)}
          />

          <main className="min-w-0 flex-1 px-4 pb-8 sm:px-6 lg:px-8">
            <ProductsTable
              products={products}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </main>
        </div>
      </div>
    </>
  );
}
