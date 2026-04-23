/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../../components/common/layout";
import PlantSizeEditor from "@/components/product/PlantSizeEditor";
import OriginAddressFields from "@/components/product/OriginAddressFields";
import { DEFAULT_DELIVERY_LOCATION } from "@/utils/delivery";
import { normalizePlantSizes, PlantSizeOption } from "@/utils/productOptions";

interface ProductTagSource {
  tags?: string[];
}

export default function EditProduct() {
  const router = useRouter();
  const { id } = router.query;
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "Indoor Plants",
    price: "",
    mrp: "",
    description: "",
    tags: "",
    image: "",
    brand: "",
    originAddress: { ...DEFAULT_DELIVERY_LOCATION, address: "" },
  });
  const [plantSizes, setPlantSizes] = useState<PlantSizeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("vendorToken");
    const role = localStorage.getItem("vendorRole");

    if (!token || role !== "vendor") {
      router.push("/vendor/login");
      return;
    }

    if (!id) return;

    const fetchProduct = async () => {
      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const response = await fetch(`${BACKEND_URL}/api/products/${id}`);
        if (!response.ok) throw new Error("Failed to fetch product");

        const data = await response.json();
        const productData = data.product || data;
        setFormData({
          name: productData.name,
          category: productData.category,
          price: String(productData.price),
          mrp: String(productData.mrp),
          description: productData.description || "",
          tags: Array.isArray(productData.tags)
            ? productData.tags.join(", ")
            : "",
          image: productData.image,
          brand: productData.brand || "",
          originAddress: {
            ...DEFAULT_DELIVERY_LOCATION,
            address: productData.originAddress?.address || "",
            city:
              productData.originAddress?.city || DEFAULT_DELIVERY_LOCATION.city,
            state:
              productData.originAddress?.state ||
              DEFAULT_DELIVERY_LOCATION.state,
            pincode:
              productData.originAddress?.pincode ||
              DEFAULT_DELIVERY_LOCATION.pincode,
            country:
              productData.originAddress?.country ||
              DEFAULT_DELIVERY_LOCATION.country,
          },
        });

        const productTags = Array.isArray(productData.tags)
          ? productData.tags.map((tag: string) => String(tag).trim())
          : [];
        setTagOptions(productTags.filter(Boolean));
        setPlantSizes(
          normalizePlantSizes(
            productData.plantSizes,
            productData.price,
            productData.mrp,
          ),
        );
      } catch (fetchError) {
        setError("Failed to load product");
        console.error("Error:", fetchError);
      } finally {
        setLoading(false);
      }
    };

    const fetchTagSuggestions = async () => {
      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const response = await fetch(`${BACKEND_URL}/api/products`);
        if (!response.ok) return;
        const data = await response.json();
        const allProducts = Array.isArray(data) ? data : data.products || [];
        const tags = Array.from(
          new Set(
            allProducts
              .flatMap((product: ProductTagSource) => product.tags || [])
              .map((tag: string) => String(tag).trim())
              .filter(Boolean),
          ),
        ) as string[];
        setTagOptions(tags);
      } catch (err) {
        console.error("Failed to fetch tag suggestions", err);
      }
    };

    fetchTagSuggestions();
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

  const parseTags = (value: string) =>
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  const addTag = (tag: string) => {
    const current = parseTags(formData.tags);
    if (current.includes(tag)) return;
    setFormData({ ...formData, tags: [...current, tag].join(", ") });
  };

  const removeTag = (tag: string) => {
    const current = parseTags(formData.tags).filter((t) => t !== tag);
    setFormData({ ...formData, tags: current.join(", ") });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formData.name || !formData.price || !formData.mrp || !formData.image) {
      setError("Name, default price, MRP, and image URL are required");
      return;
    }

    if (Number(formData.mrp) < Number(formData.price)) {
      setError("MRP must be greater than or equal to Price");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const adminToken = localStorage.getItem("adminToken");
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken || token}`,
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

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to update product");
        return;
      }

      router.push("/vendor/dashboard");
    } catch (submitError) {
      setError("Error updating product");
      console.error("Error:", submitError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("vendorToken");
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        router.push("/vendor/dashboard");
      } else {
        alert("Failed to delete product");
      }
    } catch {
      alert("Error deleting product");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Product | Verdora</title>
      </Head>
      <Layout>
        <div className="min-h-screen bg-gray-50 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-green-700">
                Edit Product
              </h1>
              <Link
                href="/vendor/dashboard"
                className="text-gray-600 transition hover:text-gray-800"
              >
                ← Back
              </Link>
            </div>

            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option>Indoor Plants</option>
                    <option>Outdoor Plants</option>
                    <option>Seeds</option>
                    <option>Tools & Accessories</option>
                    <option>Pots & Planters</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Default Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Default MRP
                  </label>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Plant Sizes
                  </label>
                  <span className="text-xs text-gray-500">
                    Update size-specific pricing
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
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="mt-2 h-32 rounded object-cover"
                  />
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="h-24 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {parseTags(formData.tags).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parseTags(formData.tags).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-emerald-700/80 hover:text-emerald-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {tagOptions.length > 0 && (
                  <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-green-50 p-3">
                    <p className="mb-2 text-xs uppercase tracking-wide text-green-700">
                      Tag Suggestions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tagOptions.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs text-green-700 transition hover:border-green-300 hover:bg-green-100"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 rounded-lg bg-red-600 py-3 font-bold text-white transition hover:bg-red-700"
                >
                  Delete Product
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
