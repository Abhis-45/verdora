/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Toast from "@/components/shared/Toast";
import Link from "next/link";
import PlantSizeEditor from "@/components/product/PlantSizeEditor";
import OriginAddressFields from "@/components/product/OriginAddressFields";
import { DEFAULT_DELIVERY_LOCATION } from "@/utils/delivery";
import { normalizePlantSizes, PlantSizeOption } from "@/utils/productOptions";

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    name: "",
    category: "Indoor Plants",
    price: "",
    mrp: "",
    image: "",
    description: "",
    tags: "",
    brand: "",
    originAddress: { ...DEFAULT_DELIVERY_LOCATION, address: "" },
  });
  const [plantSizes, setPlantSizes] = useState<PlantSizeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${id}`);
        if (!response.ok) throw new Error("Product not found");
        const data = await response.json();
        const product = data.product || data;
        setFormData({
          name: product.name,
          category: product.category,
          price: String(product.price),
          mrp: String(product.mrp),
          image: product.image,
          description: product.description || "",
          tags: product.tags?.join(", ") || "",
          brand: product.brand || "",
          originAddress: {
            ...DEFAULT_DELIVERY_LOCATION,
            address: product.originAddress?.address || "",
            city: product.originAddress?.city || DEFAULT_DELIVERY_LOCATION.city,
            state:
              product.originAddress?.state || DEFAULT_DELIVERY_LOCATION.state,
            pincode:
              product.originAddress?.pincode ||
              DEFAULT_DELIVERY_LOCATION.pincode,
            country:
              product.originAddress?.country ||
              DEFAULT_DELIVERY_LOCATION.country,
          },
        });
        setPlantSizes(
          normalizePlantSizes(product.plantSizes, product.price, product.mrp),
        );
      } catch {
        setToast({
          message: "Failed to load product",
          type: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  useEffect(() => {
    setPlantSizes((current) =>
      current.map((size, index) =>
        index === 0 && size.isDefault
          ? {
              ...size,
              price: Number(formData.price || 0),
              mrp: Number(formData.mrp || 0),
            }
          : size,
      ),
    );
  }, [formData.price, formData.mrp]);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "mrp"
          ? value
            ? Number(value)
            : ""
          : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!formData.name || !formData.price || !formData.mrp || !formData.image) {
      setToast({
        message: "Please fill in all required fields",
        type: "error",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/manage/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          mrp: Number(formData.mrp),
          tags: formData.tags
            ? formData.tags.split(",").map((tag) => tag.trim())
            : [],
          plantSizes,
          originAddress: formData.originAddress,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update product");
      }

      setToast({
        message: "Product updated successfully!",
        type: "success",
      });

      setTimeout(() => router.push("/admin/dashboard"), 1000);
    } catch (error: unknown) {
      setToast({
        message: (error as any)?.message || "Failed to update product",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading product...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Product | Verdora</title>
      </Head>
      <div className="min-h-screen bg-gray-100">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <Link
                href="/admin/dashboard"
                className="font-medium text-gray-600 transition hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8 shadow">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Indoor Plants">Indoor Plants</option>
                  <option value="Flowering Plants">Flowering Plants</option>
                  <option value="Herbs">Herbs</option>
                  <option value="Succulents">Succulents</option>
                  <option value="Outdoor Plants">Outdoor Plants</option>
                  <option value="Seasonal Plants">Seasonal Plants</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Default Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Default MRP (₹) *
                  </label>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Plant Sizes
                  </label>
                  <span className="text-xs text-gray-500">
                    Update size pricing for customers
                  </span>
                </div>
                <PlantSizeEditor sizes={plantSizes} onChange={setPlantSizes} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor Shop Dispatch Address
                  </label>
                  <span className="text-xs text-gray-500">
                    Used for delivery estimates
                  </span>
                </div>
                <OriginAddressFields
                  value={formData.originAddress}
                  onChange={(originAddress) =>
                    setFormData((prev) => ({ ...prev, originAddress }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Image URL *
                </label>
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Product preview"
                      className="h-32 w-32 rounded object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-2 font-bold text-white transition hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? "Updating..." : "Update Product"}
                </button>
                <Link
                  href="/admin/dashboard"
                  className="flex-1 rounded-lg bg-gray-300 px-4 py-2 text-center font-bold text-gray-800 transition hover:bg-gray-400"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
