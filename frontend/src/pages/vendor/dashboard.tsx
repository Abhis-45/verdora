/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  brand: string;
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);
  const [updatingOrderItemId, setUpdatingOrderItemId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const tok = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role");
    if (!tok || role !== "vendor") {
      router.push("/admin/login");
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
      const res = await fetch(`${BACKEND_URL}/api/vendor/products?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Fetch vendor products error:", err);
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
      const res = await fetch(`${BACKEND_URL}/api/vendor/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendorOrders(Array.isArray(data.orders) ? data.orders : []);
      }
    } catch (err) {
      console.error("Fetch vendor orders error:", err);
    }
  };

  const handleUpdateProfile = async (e: any) => {
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

  const handleUpdateProduct = async (e: any) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/vendor/products/${selectedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedProduct),
      });

      if (res.ok) {
        alert("Product updated successfully!");
        setShowEditProductModal(false);
        setSelectedProduct(null);
        fetchProducts(token);
      }
    } catch (err) {
      console.error("Update product error:", err);
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
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    localStorage.removeItem("adminName");
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

    setUpdatingOrderItemId(itemId);
    try {
      const res = await fetch(
        `/api/vendor/orders/${orderId}/items/${itemId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
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
                  item.itemId === itemId ? { ...item, status } : item,
                ),
                status: data.orderStatus || status,
              },
        ),
      );
    } catch (err) {
      console.error("Update vendor order status error:", err);
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
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-linear-to-r from-emerald-700 to-teal-600 text-white shadow-lg">
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
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {product.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {product.category}
                        </p>
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
                            setSelectedProduct(product);
                            setShowEditProductModal(true);
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
                        <td className="px-6 py-3">{product.name}</td>
                        <td className="px-6 py-3">{product.category}</td>
                        <td className="px-6 py-3">₹{product.price}</td>
                        <td className="px-6 py-3">₹{product.mrp}</td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowEditProductModal(true);
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
                      <p className="mt-1 text-sm text-gray-700">
                        {order.customer} · {order.email || order.mobile}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(order.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {order.itemsCount} item
                        {order.itemsCount !== 1 ? "s" : ""}
                      </p>
                      <p className="mt-1 text-sm text-emerald-700">
                        Rs. {Number(order.vendorSubtotal || 0).toFixed(2)}
                      </p>
                      {order.address?.city && (
                        <p className="mt-1 text-xs text-gray-500">
                          Deliver to {order.address.city}, {order.address.state}
                        </p>
                      )}
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
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
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
                            <div>
                              <p className="font-semibold text-gray-900">
                                {item.title}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Qty {item.quantity}
                                {item.selectedSize?.label
                                  ? ` · Size ${item.selectedSize.label}`
                                  : ""}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-emerald-700">
                                Rs. {Number(item.price || 0).toFixed(2)}
                              </p>
                              {item.statusReason && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.statusReason}
                                </p>
                              )}
                              {item.returnRequestImages &&
                                item.returnRequestImages.length > 0 && (
                                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
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

      {/* Edit Product Modal */}
      {showEditProductModal && selectedProduct && (
        <div className="app-modal-shell">
          <div className="app-modal-card w-full max-w-md rounded-lg bg-white p-5 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-bold text-emerald-700 mb-6">
              Edit Product
            </h2>
            <form onSubmit={handleUpdateProduct}>
              <input
                type="text"
                value={selectedProduct.name}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    name: e.target.value,
                  })
                }
                placeholder="Product Name"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <input
                type="text"
                value={selectedProduct.category}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    category: e.target.value,
                  })
                }
                placeholder="Category"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <input
                type="number"
                value={selectedProduct.price}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    price: Number(e.target.value),
                  })
                }
                placeholder="Price"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <input
                type="number"
                value={selectedProduct.mrp}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    mrp: Number(e.target.value),
                  })
                }
                placeholder="MRP"
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition mb-3"
              >
                Update Product
              </button>
              <button
                type="button"
                onClick={() => setShowEditProductModal(false)}
                className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
