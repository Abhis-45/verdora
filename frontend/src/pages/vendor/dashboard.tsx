/* eslint-disable @next/next/no-img-element */
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  ArrowLeftOnRectangleIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import RefreshButton from "@/components/shared/RefreshButton";

interface VendorProfile {
  _id: string;
  username: string;
  email: string;
  businessName: string;
  businessDescription: string;
  businessPhone: string;
  businessLocation: string;
  businessWebsite: string;
  status: "active" | "inactive";
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  brand?: string;
  description?: string;
  tags?: string[];
  image?: string;
  images?: { url: string; publicId?: string }[];
  originAddress?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  plantSizes?: {
    id: string;
    label: string;
    price: number;
    mrp: number;
    isDefault?: boolean;
  }[];
}

interface VendorStats {
  totalProducts: number;
  totalRevenue: number;
}

interface VendorOrderItem {
  itemId: string;
  productId: string;
  title: string;
  image?: string;
  quantity: number;
  price: number;
  status: string;
  statusReason?: string;
  trackingId?: string;
  deliveryOTP?: string;
  returnRequestImages?: { url: string; publicId?: string }[];
  selectedSize?: {
    label?: string;
  };
}

interface VendorOrder {
  id: string;
  customer: string;
  email: string;
  mobile: string;
  date: string;
  status: string;
  vendorSubtotal: number;
  itemsCount: number;
  items: VendorOrderItem[];
  address?: {
    label?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export default function VendorDashboard() {
  const router = useRouter();
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(
    null,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [search, setSearch] = useState("");
  const [productSort, setProductSort] = useState("latest");
  const [orderSort, setOrderSort] = useState("latest");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorProfile>>({});
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);
  const [updatingOrderItemId, setUpdatingOrderItemId] = useState<string | null>(
    null,
  );
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [currentOrderContext, setCurrentOrderContext] = useState<{
    orderId: string;
    itemId: string;
    trackingId: string;
  } | null>(null);
  const [showDeliveryOTPModal, setShowDeliveryOTPModal] = useState(false);

  useEffect(() => {
    const tok = localStorage.getItem("vendorToken");
    const role = localStorage.getItem("vendorRole");
    if (!tok || role !== "vendor") {
      router.push("/vendor/login");
    } else {
      setToken(tok);
      fetchVendorProfile(tok);
      fetchProducts(tok);
      fetchStats(tok);
      fetchVendorOrders(tok);
    }
  }, [router]);

  const fetchVendorProfile = async (authToken: string) => {
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/vendor/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendorProfile(data);
        setFormData(data);
      }
    } catch (err) {
      console.error("Fetch vendor profile error:", err);
    }
  };

  const fetchProducts = async (authToken: string, searchTerm = "") => {
    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      const res = await fetch(`${BACKEND_URL}/api/vendor/products?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (!res.ok) {
        console.error("Products API error:", res.status, data);
        setProducts([]);
        return;
      }
      
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      console.error("Fetch vendor products error:", err);
      setProducts([]);
    }
    setLoading(false);
  };

  const fetchStats = async (authToken: string) => {
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/vendor/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error("Fetch vendor stats error:", err);
    }
  };

  const fetchVendorOrders = async (authToken: string) => {
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const res = await fetch(`${BACKEND_URL}/api/vendor/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (!res.ok) {
        console.error("Orders API error:", res.status, data);
        setVendorOrders([]);
        return;
      }
      
      setVendorOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error("Fetch vendor orders error:", err);
      setVendorOrders([]);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
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
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Profile updated successfully!");
        setShowProfileModal(false);
        fetchVendorProfile(token);
      }
    } catch (err) {
      console.error("Update profile error:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/vendor/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Delete product error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendorRole");
    localStorage.removeItem("vendorName");
    localStorage.removeItem("vendorId");
    localStorage.removeItem("vendorEmail");
    router.push("/");
  };

  const handleHomeClick = () => {
    handleLogout();
  };

  const handleSearch = () => {
    fetchProducts(token, search);
  };

  const handleOrderStatusUpdate = async (
    orderId: string,
    itemId: string,
    status: string,
  ) => {
    if (!token) return;

    // Show tracking ID modal for shipped status
    if (status === "shipped") {
      setCurrentOrderContext({ orderId, itemId, trackingId: "" });
      setShowTrackingModal(true);
      return;
    }

    // Show delivery OTP modal for delivered status
    if (status === "delivered") {
      setCurrentOrderContext({ orderId, itemId, trackingId: "" });
      setShowDeliveryOTPModal(true);
      return;
    }

    // For other statuses, update directly
    await updateItemStatus(orderId, itemId, status, "");
  };

  const updateItemStatus = async (
    orderId: string,
    itemId: string,
    status: string,
    trackingId: string = "",
  ) => {
    setUpdatingOrderItemId(itemId);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(
        `${BACKEND_URL}/api/vendor/orders/${orderId}/items/${itemId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, trackingId }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to update item status");
      }

      const data = await res.json();

      setVendorOrders((current) =>
        current.map((order) =>
          order.id !== orderId
            ? order
            : {
                ...order,
                items: order.items.map((item) =>
                  item.itemId === itemId
                    ? {
                        ...item,
                        status,
                        trackingId: trackingId || item.trackingId || "",
                      }
                    : item,
                ),
                status: data.orderStatus || status,
              },
        ),
      );
    } catch (err) {
      console.error("Update vendor order status error:", err);
      alert("Failed to update order status. Please try again.");
    } finally {
      setUpdatingOrderItemId(null);
    }
  };

  const StatCard = ({
    title,
    value,
  }: {
    title: string;
    value: number | string;
  }) => (
    <div className="bg-linear-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
      <p className="text-emerald-600 text-sm font-semibold">{title}</p>
      <p className="text-3xl font-bold text-emerald-700 mt-2">{value}</p>
    </div>
  );

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (productSort === "price-low") {
      return list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    if (productSort === "price-high") {
      return list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }
    if (productSort === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [productSort, products]);

  const sortedVendorOrders = useMemo(() => {
    const list = [...vendorOrders];
    if (orderSort === "oldest") {
      return list.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }
    if (orderSort === "amount-high") {
      return list.sort(
        (a, b) => Number(b.vendorSubtotal || 0) - Number(a.vendorSubtotal || 0),
      );
    }
    if (orderSort === "customer") {
      return list.sort((a, b) => a.customer.localeCompare(b.customer));
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [orderSort, vendorOrders]);

  return (
        <div className="min-h-screen bg-linear-to-b from-emerald-50 to-teal-50 pt-10 lg:pt-16">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-linear-to-r from-emerald-700 to-teal-600 text-white shadow-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Verdora Vendor Dashboard
            </h1>
            <p className="text-emerald-100 mt-1">
              Welcome, {vendorProfile?.username}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/vendor/settings"
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-600"
            >
              <CogIcon className="w-5 h-5" /> Settings
            </Link>
            <button
              onClick={handleHomeClick}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              <HomeIcon className="w-5 h-5" /> Home
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Statistics Section */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <StatCard title="Total Products" value={stats?.totalProducts || 0} />
          <StatCard
            title="Total Revenue"
            value={`Rs. ${stats?.totalRevenue || 0}`}
          />
        </div>

        {/* Business Profile Section */}
        <div className="mb-10 rounded-lg bg-white p-5 shadow-lg sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-emerald-700">
              Business Profile
            </h2>
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition hover:bg-teal-700"
            >
              <PencilIcon className="w-5 h-5" /> Edit Profile
            </button>
          </div>

          {vendorProfile && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-gray-600 text-sm">Business Name</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vendorProfile.businessName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Business Phone</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vendorProfile.businessPhone || "N/A"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-600 text-sm">Business Description</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vendorProfile.businessDescription || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Location</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vendorProfile.businessLocation || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Website</p>
                <p className="text-lg font-semibold text-gray-900">
                  {vendorProfile.businessWebsite || "N/A"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Products Section */}
        <div className="rounded-lg bg-white p-5 shadow-lg sm:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold text-emerald-700">My Products</h2>
            <Link href="/vendor/add-product">
              <button className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition hover:bg-teal-700">
                <PlusIcon className="w-5 h-5" /> Add Product
              </button>
            </Link>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-lg border border-emerald-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white transition hover:bg-emerald-700"
            >
              <MagnifyingGlassIcon className="w-5 h-5" /> Search
            </button>
            <select
              value={productSort}
              onChange={(event) => setProductSort(event.target.value)}
              className="rounded-lg border border-emerald-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="latest">Sort: Default</option>
              <option value="name">Name A-Z</option>
              <option value="price-low">Price Low-High</option>
              <option value="price-high">Price High-Low</option>
            </select>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {(product.image || (product.images && product.images.length > 0)) && (
                          <div className="relative">
                            <img
                              src={product.image || product.images?.[0]?.url || ""}
                              alt={product.name}
                              className="h-16 w-16 rounded-xl object-cover"
                            />
                            {((product.images && product.images.length > 1) || (product.image && product.images && product.images.length > 0)) && (
                              <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                                {product.images ? product.images.length : (product.image ? 1 : 0)}
                              </div>
                            )}
                          </div>
                        )}
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {product.category}
                          </p>
                          {product.tags && product.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                            {product.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="mt-1 font-semibold text-emerald-700">
                            Rs. {product.price}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white p-3">
                          <p className="text-xs text-gray-500">MRP</p>
                          <p className="mt-1 font-semibold text-gray-900">
                            Rs. {product.mrp}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 min-[420px]:flex-row">
                        <button
                          onClick={() => {
                            router.push(`/vendor/add-product?productId=${product.id}`);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-3 py-2 text-white transition hover:bg-yellow-600"
                        >
                          <PencilIcon className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2 text-white transition hover:bg-red-600"
                        >
                          <TrashIcon className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-emerald-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-emerald-700 font-semibold">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-emerald-700 font-semibold">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-emerald-700 font-semibold">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-emerald-700 font-semibold">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-emerald-700 font-semibold">
                        MRP
                      </th>
                      <th className="px-6 py-3 text-center text-emerald-700 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProducts.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t border-emerald-100 hover:bg-emerald-50"
                      >
                        <td className="px-6 py-3">
                          <div className="flex gap-1">
                            {product.images && product.images.length > 0 ? (
                              product.images.slice(0, 3).map((img, index) => (
                                <div
                                  key={index}
                                  className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100"
                                >
                                  <img
                                    src={img.url}
                                    alt={`${product.name} ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ))
                            ) : product.image ? (
                              <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                                No image
                              </div>
                            )}
                            {((product.images && product.images.length > 3) || (product.image && product.images && product.images.length > 0)) && (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-xs font-semibold text-emerald-700">
                                +{product.images ? Math.max(0, product.images.length - 3) : (product.image ? 1 : 0)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-col gap-1">
                            <span>{product.name}</span>
                            {product.tags && product.tags.length > 0 && (
                              <span className="text-xs text-emerald-600">
                                {product.tags.slice(0, 3).join(", ")}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3">{product.category}</td>
                        <td className="px-6 py-3">₹{product.price}</td>
                        <td className="px-6 py-3">₹{product.mrp}</td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => {
                              router.push(`/vendor/add-product?productId=${product.id}`);
                            }}
                            className="mr-2 inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600"
                          >
                            <PencilIcon className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1 text-white hover:bg-red-600"
                          >
                            <TrashIcon className="w-4 h-4" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {products.length === 0 && (
                  <p className="text-center text-gray-500 mt-6">
                    No products found
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-10 rounded-lg bg-white p-5 shadow-lg sm:p-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-emerald-700">
                Manage Orders
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Daily customer orders for your products. Update each item from
                accepted to shipped to delivered.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={orderSort}
                onChange={(event) => setOrderSort(event.target.value)}
                className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="latest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount-high">Highest amount</option>
                <option value="customer">Customer name</option>
              </select>
              <RefreshButton
                label="Refresh Orders"
                onClick={() => fetchVendorOrders(token)}
              />
            </div>
          </div>

          {vendorOrders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-gray-600">
              No vendor orders yet.
            </p>
          ) : (
            <div className="space-y-4">
              {sortedVendorOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-emerald-100 p-4"
                >
                  <div className="flex flex-col gap-3 border-b border-emerald-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-emerald-800">
                        Order #{order.id.slice(-6)}
                      </p>
                      <div className="mt-2 rounded-lg bg-white p-3 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          👤 Customer Details
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {order.customer}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          📧 {order.email || "N/A"}
                        </p>
                        <p className="text-xs text-gray-600">
                          📞 {order.mobile || "N/A"}
                        </p>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        📅 {new Date(order.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                        <p className="text-xs font-semibold text-blue-600 mb-2">
                          📍 Shipping Address
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {order.address?.address || "N/A"}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          {order.address?.city || "N/A"}, {order.address?.state || "N/A"}
                        </p>
                        <p className="text-xs text-gray-600">
                          Pin: {order.address?.pincode || "N/A"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3 border border-green-200">
                        <p className="text-xs font-semibold text-green-600 mb-1">
                          📦 Order Summary
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {order.itemsCount} item{order.itemsCount !== 1 ? "s" : ""}
                        </p>
                        <p className="mt-1 text-lg font-bold text-emerald-700">
                          Rs. {Number(order.vendorSubtotal || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.itemId}
                        className="rounded-xl bg-emerald-50/60 p-3"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex gap-3">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white border border-gray-200">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-900">
                                {item.title}
                              </p>
                              {item.selectedSize?.label && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Size: {item.selectedSize.label}
                                </p>
                              )}
                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-amber-50 p-2 rounded border border-amber-200">
                                  <p className="text-gray-600">Quantity</p>
                                  <p className="font-bold text-amber-700">{item.quantity}</p>
                                </div>
                                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                  <p className="text-gray-600">Unit Price</p>
                                  <p className="font-bold text-blue-700">Rs. {Number(item.price || 0).toFixed(2)}</p>
                                </div>
                                <div className="bg-green-50 p-2 rounded border border-green-200 col-span-2">
                                  <p className="text-gray-600">Amount</p>
                                  <p className="font-bold text-green-700">Rs. {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</p>
                                </div>
                              </div>
                              {item.statusReason && (
                                <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                  {item.statusReason}
                                </p>
                              )}
                              {item.trackingId && (
                                <p className="mt-1 text-xs text-blue-600 font-semibold bg-blue-50 p-2 rounded">
                                  📦 Tracking: {item.trackingId}
                                </p>
                              )}
                              {item.deliveryOTP && item.status === "delivered" && (
                                <p className="mt-1 text-xs text-green-600 font-semibold bg-green-50 p-2 rounded">
                                  ✅ OTP: {item.deliveryOTP}
                                </p>
                              )}
                              {item.returnRequestImages &&
                                item.returnRequestImages.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold text-gray-700 mb-2">Return Images:</p>
                                    <div className="grid grid-cols-4 gap-2">
                                      {item.returnRequestImages.map(
                                        (image, index) => (
                                          <div
                                            key={`${item.itemId}-${index}`}
                                            className="overflow-hidden rounded-lg border border-emerald-100 bg-white"
                                          >
                                            <img
                                              src={image.url}
                                              alt={`Support proof ${index + 1}`}
                                              className="h-16 w-full object-cover"
                                            />
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="flex w-full flex-col gap-2 md:w-auto">
                            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                              {["accepted", "shipped", "delivered"].map(
                                (status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    disabled={
                                      updatingOrderItemId === item.itemId
                                    }
                                    onClick={() =>
                                      handleOrderStatusUpdate(
                                        order.id,
                                        item.itemId,
                                        status,
                                      )
                                    }
                                    className={`rounded-lg px-3 py-2 text-center text-xs font-semibold capitalize transition ${
                                      item.status === status
                                        ? "bg-emerald-600 text-white"
                                        : "bg-white text-emerald-700 hover:bg-emerald-100"
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ),
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              Current: {item.status.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="app-modal-shell">
          <div className="app-modal-card w-full max-w-md rounded-lg bg-white p-5 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-bold text-emerald-700 mb-6">
              Edit Business Profile
            </h2>
            <form onSubmit={handleUpdateProfile}>
              <input
                type="text"
                value={formData.businessName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
                placeholder="Business Name"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <input
                type="tel"
                value={formData.businessPhone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, businessPhone: e.target.value })
                }
                placeholder="Business Phone"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <input
                type="text"
                value={formData.businessLocation || ""}
                onChange={(e) =>
                  setFormData({ ...formData, businessLocation: e.target.value })
                }
                placeholder="Business Location"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <input
                type="url"
                value={formData.businessWebsite || ""}
                onChange={(e) =>
                  setFormData({ ...formData, businessWebsite: e.target.value })
                }
                placeholder="Business Website"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <textarea
                value={formData.businessDescription || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    businessDescription: e.target.value,
                  })
                }
                placeholder="Business Description"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-3 h-20 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition mb-3"
              >
                Update Profile
              </button>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tracking ID Modal */}
      {showTrackingModal && currentOrderContext && (
        <div className="app-modal-shell">
          <div className="app-modal-card w-full max-w-md rounded-lg bg-white p-5 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-bold text-emerald-700 mb-6">
              📦 Enter Tracking ID
            </h2>
            <p className="text-gray-600 mb-4">
              Please provide the tracking ID for the shipment so the customer can track their order.
            </p>
            <input
              type="text"
              value={currentOrderContext.trackingId}
              onChange={(e) =>
                setCurrentOrderContext({
                  ...currentOrderContext,
                  trackingId: e.target.value,
                })
              }
              placeholder="e.g., TRK123456789"
              className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (currentOrderContext.trackingId.trim()) {
                    updateItemStatus(
                      currentOrderContext.orderId,
                      currentOrderContext.itemId,
                      "shipped",
                      currentOrderContext.trackingId,
                    );
                    setShowTrackingModal(false);
                    setCurrentOrderContext(null);
                  } else {
                    alert("Please enter a tracking ID");
                  }
                }}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Confirm Shipping
              </button>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setCurrentOrderContext(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery OTP Modal */}
      {showDeliveryOTPModal && currentOrderContext && (
        <div className="app-modal-shell">
          <div className="app-modal-card w-full max-w-md rounded-lg bg-white p-5 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-bold text-emerald-700 mb-6">
              ✅ Confirm Delivery
            </h2>
            <p className="text-gray-600 mb-4">
              An OTP will be generated and sent to the customer. They will need to provide this OTP upon receiving the item to confirm delivery.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The customer will receive the OTP via SMS/Email. They must verify it to mark the delivery as complete.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  updateItemStatus(
                    currentOrderContext.orderId,
                    currentOrderContext.itemId,
                    "delivered",
                  );
                  setShowDeliveryOTPModal(false);
                  setCurrentOrderContext(null);
                }}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Generate OTP & Mark Delivered
              </button>
              <button
                onClick={() => {
                  setShowDeliveryOTPModal(false);
                  setCurrentOrderContext(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal - Removed, now redirects to add-product page */}
    </div>
  );
}
