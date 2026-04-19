/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { HomeIcon, XMarkIcon } from "@heroicons/react/24/solid";
import PlantSizeEditor from "@/components/product/PlantSizeEditor";
import OriginAddressFields from "@/components/product/OriginAddressFields";
import { DEFAULT_DELIVERY_LOCATION } from "@/utils/delivery";
import {
  CUSTOM_CATEGORY_OPTION,
  DEFAULT_PLANT_SIZE_ID,
  FREE_SIZE_LABEL,
  PlantSizeOption,
  PRODUCT_CATEGORY_OPTIONS,
} from "@/utils/productOptions";

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

interface ProductTagSource {
  tags?: string[];
}

const defaultSize: PlantSizeOption = {
  id: DEFAULT_PLANT_SIZE_ID,
  label: FREE_SIZE_LABEL,
  price: 0,
  mrp: 0,
  isDefault: true,
};

export default function AddProduct() {
  const router = useRouter();
  const productIdQuery = router.query.productId;
  const [formData, setFormData] = useState({
    name: "",
    category: "Indoor Plants",
    price: "",
    mrp: "",
    brand: "",
    description: "",
    tags: "",
    originAddress: { ...DEFAULT_DELIVERY_LOCATION, address: "" },
  });
  const [plantSizes, setPlantSizes] = useState<PlantSizeOption[]>([
    defaultSize,
  ]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(
    PRODUCT_CATEGORY_OPTIONS,
  );
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("vendorToken");
    const role = localStorage.getItem("vendorRole");

    if (!token || role !== "vendor") {
      router.push("/vendor/login");
      return;
    }

    const fetchCategoryOptions = async () => {
      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const response = await fetch(`${BACKEND_URL}/api/products`);
        if (!response.ok) return;

        const data = await response.json();
        const products = Array.isArray(data) ? data : data.products || [];
        const dynamicCategories = products
          .map((product: { category?: string }) => product.category?.trim?.())
          .filter(Boolean);

        const uniqueCategories = Array.from(
          new Set([...PRODUCT_CATEGORY_OPTIONS, ...dynamicCategories]),
        );
        setCategoryOptions(uniqueCategories);

        const collectedTags = Array.from(
          new Set(
            products
              .flatMap((product: ProductTagSource) => product.tags || [])
              .map((tag: string) => String(tag).trim())
              .filter(Boolean),
          ),
        ) as string[];
        setTagOptions(collectedTags);
      } catch {
        // Keep default category list when fetch fails.
      }
    };

    const fetchVendorDefaults = async () => {
      if (role !== "vendor") return;

      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const response = await fetch(`${BACKEND_URL}/api/vendor/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;
        const profile = await response.json();

        setFormData((current) => ({
          ...current,
          brand:
            current.brand || profile.businessName || profile.vendorName || "",
          originAddress: {
            ...current.originAddress,
            address:
              current.originAddress.address || profile.businessLocation || "",
          },
        }));
      } catch {
        // Let the vendor keep entering custom data if profile fetch fails.
      }
    };

    fetchCategoryOptions();
    fetchVendorDefaults();
  }, [router]);

  useEffect(() => {
    if (!router.isReady) return;

    if (productIdQuery && typeof productIdQuery === "string") {
      setProductId(productIdQuery);
      setIsEditMode(true);
      fetchExistingProduct(productIdQuery);
    }
  }, [productIdQuery, router.isReady]);

  const fetchExistingProduct = async (id: string) => {
    try {
      const token = localStorage.getItem("vendorToken");
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setError("Failed to load product details");
        return;
      }

      const product = await response.json();

      // Pre-fill form with existing product data
      setFormData({
        name: product.name || "",
        category: product.category || "Indoor Plants",
        price: product.price || "",
        mrp: product.mrp || "",
        brand: product.brand || "",
        description: product.description || "",
        tags: (product.tags || []).join(", "),
        originAddress: product.originAddress || {
          ...DEFAULT_DELIVERY_LOCATION,
          address: "",
        },
      });

      // Pre-fill plant sizes
      if (product.plantSizes && product.plantSizes.length > 0) {
        setPlantSizes(product.plantSizes);
      }

      // Pre-fill images if available
      if (product.image) {
        setImages([
          {
            id: product.cloudinaryPublicId || "existing",
            file: new File([], "existing-image"),
            preview: product.image,
          },
        ]);
        setMainImageIndex(0);
      }
    } catch (err) {
      setError(`Failed to load product: ${err}`);
    }
  };

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
    setFormData({
      ...formData,
      tags: [...current, tag].join(", "),
    });
  };

  const removeTag = (tag: string) => {
    const current = parseTags(formData.tags).filter((t) => t !== tag);
    setFormData({ ...formData, tags: current.join(", ") });
  };

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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            file,
            preview: loadEvent.target?.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((image) => image.id !== imageId));
    if (mainImageIndex >= images.length - 1 && mainImageIndex > 0) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const uploadImagesToCloudinary = async () => {
    if (images.length === 0) {
      setError("Please select at least one image");
      return null;
    }

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const image of images) {
        const formDataUpload = new FormData();
        formDataUpload.append("image", image.file);

        const token = localStorage.getItem("vendorToken");
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const response = await fetch(`${BACKEND_URL}/api/products/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataUpload,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Upload failed");
        }

        const data = await response.json();
        uploadedUrls.push({
          url: data.url,
          publicId: data.publicId,
        });
      }

      return uploadedUrls;
    } catch (uploadError) {
      setError(`Image upload failed: ${uploadError}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formData.name || !formData.price || !formData.mrp) {
      setError("Name, default price, and default MRP are required");
      return;
    }

    if (
      formData.category === CUSTOM_CATEGORY_OPTION &&
      !customCategory.trim()
    ) {
      setError("Please enter your new category name");
      return;
    }

    if (!isEditMode && images.length === 0) {
      setError("Please select at least one product image");
      return;
    }

    setLoading(true);
    try {
      let uploadedUrls: { url: string; publicId: string }[] = [];
      
      // Only upload new images if we have files to upload (not just previews)
      const hasNewImages = images.some((img) => img.file.size > 0);
      if (hasNewImages) {
        const result = await uploadImagesToCloudinary();
        if (!result?.length) {
          setLoading(false);
          return;
        }
        uploadedUrls = result;
      } else if (isEditMode && images.length > 0) {
        // Use existing image URLs if editing without new uploads
        uploadedUrls = images.map((img) => ({
          url: img.preview,
          publicId: img.id === "existing" ? "" : img.id,
        }));
      }

      const token = localStorage.getItem("vendorToken");
      const mainImage = uploadedUrls[mainImageIndex] || uploadedUrls[0];

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const endpoint = isEditMode
        ? `${BACKEND_URL}/api/products/${productId}`
        : `${BACKEND_URL}/api/products`;
      
      const method = isEditMode ? "PATCH" : "POST";
      
      const requestBody = {
        ...formData,
        category:
          formData.category === CUSTOM_CATEGORY_OPTION
            ? customCategory.trim()
            : formData.category,
        image: mainImage?.url,
        cloudinaryPublicId: mainImage?.publicId,
        ...(uploadedUrls.length > 0 && { images: uploadedUrls }),
        price: Number(formData.price),
        mrp: Number(formData.mrp),
        brand: formData.brand || "Verdora",
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
        plantSizes,
        originAddress: formData.originAddress,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(
          data.message ||
            `Failed to ${isEditMode ? "update" : "create"} product`
        );
        return;
      }

      const successMessage = isEditMode
        ? "Product updated successfully!"
        : "Product created successfully with sizes and delivery details.";
      alert(successMessage);
      router.push("/vendor/dashboard");
    } catch (submitError) {
      setError(`Error ${isEditMode ? "updating" : "creating"} product: ${submitError}`);
      console.error("Error:", submitError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isEditMode ? "Edit Product" : "Add Product"} | Verdora</title>
      </Head>
            <div className="bg-linear-to-r from-emerald-700 to-teal-600 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/vendor/dashboard")}  
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              <HomeIcon className="w-5 h-5" /> Home
            </button>
          </div>
        </div>
      </div>
        <div className="min-h-screen bg-gray-50 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-green-700">
                {isEditMode ? "Edit Product Details" : "Add New Product"}
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
                  placeholder="e.g., Snake Plant"
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
                    {categoryOptions.map((categoryOption) => (
                      <option key={categoryOption} value={categoryOption}>
                        {categoryOption}
                      </option>
                    ))}
                    <option value={CUSTOM_CATEGORY_OPTION}>
                      Add New Category
                    </option>
                  </select>
                  {formData.category === CUSTOM_CATEGORY_OPTION && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(event) =>
                        setCustomCategory(event.target.value)
                      }
                      className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter new category"
                    />
                  )}
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
                    placeholder="Auto-filled from your vendor profile"
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
                    placeholder="0"
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
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Plant Sizes
                  </label>
                  <span className="text-xs text-gray-500">
                    Free Size is ready by default. Add more paid sizes if
                    needed.
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
                  Product Images
                </label>
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-green-500">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="imageInput"
                    disabled={uploading}
                    multiple
                  />
                  <label htmlFor="imageInput" className="block cursor-pointer">
                    <p className="text-sm text-gray-600">
                      Click to upload images
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="mt-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Uploaded Images ({images.length})
                      </h3>
                      <p className="text-xs text-gray-500">
                        Main image: {mainImageIndex + 1}
                      </p>
                    </div>

                    <div className="mb-6 rounded-lg border-2 border-green-200 bg-green-50 p-4">
                      <p className="mb-3 text-xs font-semibold text-green-700">
                        MAIN PRODUCT IMAGE
                      </p>
                      <img
                        src={images[mainImageIndex].preview}
                        alt="Main preview"
                        className="h-64 w-full rounded-lg object-cover"
                      />
                    </div>

                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                        {images.map((image, index) => (
                          <div
                            key={image.id}
                            className={`group relative cursor-pointer overflow-hidden rounded-lg transition ${
                              index === mainImageIndex
                                ? "ring-4 ring-green-500"
                                : "ring-1 ring-gray-200"
                            }`}
                          >
                            <img
                              src={image.preview}
                              alt={`Preview ${index + 1}`}
                              className="h-20 w-full object-cover"
                              onClick={() => setMainImageIndex(index)}
                            />
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                removeImage(image.id);
                              }}
                              className="absolute right-0 top-0 rounded-bl bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                              title="Remove image"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                            {index === mainImageIndex && (
                              <div className="absolute inset-x-0 bottom-0 bg-green-500 py-1 text-center text-xs font-bold text-white">
                                MAIN
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                  placeholder="Product description"
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
                  placeholder="e.g., indoor, low-maintenance, air-purifying"
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

              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full rounded-lg bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {loading
                  ? isEditMode
                    ? "Updating Product..."
                    : "Adding Product..."
                  : uploading
                    ? "Uploading..."
                    : isEditMode
                      ? "Update Product"
                      : "Add Product"}
              </button>
            </form>
          </div>
        </div>
    </>
  );
}
