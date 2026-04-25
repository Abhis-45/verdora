import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/router";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import ServiceRequests from "@/components/admin/ServiceRequests";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import CouponManagement from "@/components/admin/CouponManagement";

interface Product {
  _id: string;
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  brand: string;
  vendorName: string;
  description?: string;
  image?: string;
  images?: string[];
  vendorId?: { username?: string; email?: string; businessName?: string };
  plantSizes?: Array<{ id: string; label: string; price: number; mrp: number }>;
  originAddress?: { address: string; city: string; state: string; pincode: string };
  tags?: string[];
  cloudinaryPublicId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface OrderItem {
  orderId: string;
  itemId: string;
  userId: string;
  customer: string;
  email: string;
  mobile: string;
  productTitle: string;
  productImage: string;
  quantity: number;
  price: number;
  mrp: number;
  total: number;
  vendorId: string;
  vendorName: string;
  status: string;
  statusReason: string;
  returnReason: string;
  statusUpdatedAt: string;
  orderDate: string;
  address: string;
  deliveryEstimate: string;
}
interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  addresses?: Array<{ label: string; address: string; city: string; state: string; pincode: string }>;
  totalOrders?: number;
  totalSpent?: number;
  addressCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
interface Vendor {
  _id: string;
  username: string;
  email: string;
  businessName: string;
  status: "active" | "inactive";
  vendorName: string;
  mobileNumber: string;
  businessPhone: string;
  businessLocation: string;
  businessDescription?: string;
  businessWebsite?: string;
  businessLogo?: string;
  totalProducts?: number;
  totalOrders?: number;
  totalRevenue?: number;
  averageRating?: number;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
interface Admin {
  _id: string;
  username: string;
  email: string;
  status: "active" | "inactive";
  permissions?: {
    canManageProducts?: boolean;
    canManageUsers?: boolean;
    canManageVendors?: boolean;
    canManageAdmins?: boolean;
    canViewReports?: boolean;
    canManageSettings?: boolean;
  };
}
interface AdminStats {
  totalProducts: number;
  totalUsers: number;
  totalVendors: number;
  totalAdmins: number;
  totalRevenue: number;
}
interface VendorPrefillData {
  username?: string;
  email?: string;
  vendorName?: string;
  mobileNumber?: string;
  phone?: string;
  businessName?: string;
  shopName?: string;
  businessPhone?: string;
  businessLocation?: string;
  address?: string;
  businessWebsite?: string;
}
type Tab = "overview" | "orders" | "products" | "users" | "vendors" | "admins" | "service-requests" | "coupons";
type DataTab = Exclude<Tab, "overview">;
type ManageItem = Product | User | Vendor | Admin;
const adminPermissionKeys = [
  "canManageProducts",
  "canManageUsers",
  "canManageVendors",
  "canManageAdmins",
  "canViewReports",
  "canManageSettings",
] as const;

type ModalType =
  | "none"
  | "editProduct"
  | "editUser"
  | "editVendor"
  | "createAdmin"
  | "editAdmin"
  | "createUser"
  | "createVendor"
  | "orderStatus";

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [adminName, setAdminName] = useState<string>("Admin");

  useEffect(() => {
    const storedName = localStorage.getItem("adminName");
    if (storedName) {
      setAdminName(storedName);
    }
  }, []);
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalVendors: 0,
    totalAdmins: 0,
    totalRevenue: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>("none");
  const [selectedItem, setSelectedItem] = useState<
    ManageItem | OrderItem | null
  >(null);
  const [token, setToken] = useState<string>("");
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    const storedName = localStorage.getItem("adminName");
    if (storedName) {
      setAdminName(storedName);
    }
    const storedToken = localStorage.getItem("adminToken");
    if (storedToken) {
      setToken(storedToken);
    }
    setAuthChecked(true);
  }, []);
  const [, setDeleteLoading] = useState(false);
  const [vendorRequestData, setVendorRequestData] = useState<VendorPrefillData | null>(null);
  const [vendorRequestId, setVendorRequestId] = useState<string | null>(null);

  const fetchStats = useCallback(async (authToken: string) => {
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/manage/stats`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
      }
    } catch {}
  }, []);

  const fetchProducts = useCallback(
    async (authToken: string, searchTerm = "") => {
      setLoading(true);
      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const res = await fetch(
          `${BACKEND_URL}/api/admin/manage/products?search=${searchTerm}`,
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : data.products || []);
        } else {
        }
      } catch {}
      setLoading(false);
    },
    [],
  );

  const fetchUsers = useCallback(async (authToken: string, searchTerm = "") => {
    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/manage/users?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      } else {
      }
    } catch {}
    setLoading(false);
  }, []);

  const fetchVendors = useCallback(
    async (authToken: string, searchTerm = "") => {
      setLoading(true);
      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const res = await fetch(`${BACKEND_URL}/api/admin/manage/vendors?search=${searchTerm}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setVendors(Array.isArray(data) ? data : data.vendors || []);
        } else {
          console.error("Failed to fetch vendors:", res.statusText);
        }
      } catch (err) {
        console.error("Error fetching vendors:", err);
      }
      setLoading(false);
    },
    [],
  );

  const fetchAdmins = useCallback(
    async (authToken: string, searchTerm = "") => {
      setLoading(true);
      try {
        const BACKEND_URL =
          typeof window !== "undefined"
            ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
            : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
        const res = await fetch(`${BACKEND_URL}/api/admin/manage/admins?search=${searchTerm}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAdmins(Array.isArray(data) ? data : data.admins || []);
        } else {
          console.error("Failed to fetch admins:", res.statusText);
        }
      } catch (err) {
        console.error("Error fetching admins:", err);
      }
      setLoading(false);
    },
    [],
  );

  const fetchOrders = useCallback(async (authToken: string) => {
    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/manage/orders`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    const role = localStorage.getItem("role");
    if (!token || role === "vendor") {
      router.push("/admin/login");
      return;
    }

    const loadManagementData = async () => {
      await fetchStats(token);
      await fetchOrders(token);
      await fetchProducts(token);
      await fetchUsers(token);
      await fetchVendors(token);
      await fetchAdmins(token);
    };

    void loadManagementData();
  }, [
    authChecked,
    router,
    token,
    fetchStats,
    fetchOrders,
    fetchProducts,
    fetchUsers,
    fetchVendors,
    fetchAdmins,
  ]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const handleHomeClick = () => {
    handleLogout();
  };

  const handleSearch = () => {
    if (tab === "products") fetchProducts(token, search);
    else if (tab === "users") fetchUsers(token, search);
    else if (tab === "vendors") fetchVendors(token, search);
    else if (tab === "admins") fetchAdmins(token, search);
  };

  const handleDelete = async (id: string, type: string) => {
    // Show detailed cascade delete warning
    let confirmMsg = "";
    if (type === "product") {
      confirmMsg = "⚠️ DELETE PRODUCT\n\nThis will permanently delete:\n✗ Product data\n✗ All product images from cloud storage\n✗ All customer reviews for this product\n\nThis action CANNOT be undone!";
    } else if (type === "user") {
      confirmMsg = "⚠️ DELETE USER\n\nThis will permanently delete:\n✗ User profile & account\n✗ All user orders\n✗ All user reviews\n✗ User addresses\n\nThis action CANNOT be undone!";
    } else if (type === "vendor") {
      confirmMsg = "⚠️ DELETE VENDOR\n\nThis will permanently delete:\n✗ Vendor account & business details\n✗ ALL vendor products\n✗ ALL product images from cloud storage\n✗ ALL customer reviews for vendor products\n\nThis action CANNOT be undone!";
    } else if (type === "admin") {
      confirmMsg = "⚠️ DELETE ADMIN\n\nThis will permanently delete the admin account and all permissions.\n\nThis action CANNOT be undone!";
    }

    if (!confirm(confirmMsg)) return;
    
    setDeleteLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const endpoint = {
        product: `${BACKEND_URL}/api/admin/manage/products/${id}`,
        user: `${BACKEND_URL}/api/admin/manage/users/${id}`,
        vendor: `${BACKEND_URL}/api/admin/manage/vendors/${id}`,
        admin: `${BACKEND_URL}/api/admin/manage/admins/${id}`,
      }[type];

      if (!endpoint) {
        alert("❌ Invalid type");
        setDeleteLoading(false);
        return;
      }

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        
        if (type === "product") {
          setProducts(products.filter((p) => p.id !== id && p._id?.toString?.() !== id));
          alert(`✅ Product deleted!\n\nCleaned up:\n• ${data.relatedDataDeleted?.images || 0} images\n• ${data.relatedDataDeleted?.reviews || 0} reviews`);
        } else if (type === "user") {
          setUsers(users.filter((u) => u._id !== id));
          alert(`✅ User deleted!\n\nRemoved:\n• Profile & account\n• ${data.relatedDataDeleted?.orders || 0} orders\n• ${data.relatedDataDeleted?.reviews || 0} reviews`);
        } else if (type === "vendor") {
          setVendors(vendors.filter((v) => v._id !== id));
          alert(`✅ Vendor deleted!\n\nRemoved:\n• ${data.deletedCount?.products || 0} products\n• ${data.relatedDataDeleted?.images || 0} images\n• ${data.relatedDataDeleted?.reviews || 0} reviews`);
        } else if (type === "admin") {
          setAdmins(admins.filter((a) => a._id !== id));
          alert("✅ Admin account deleted successfully!");
        }
      } else {
        let errMsg = res.statusText;
        try {
          const errData = (await res.json()) as {
            message?: string;
            error?: string;
          };
          errMsg = errData.message || errData.error || res.statusText;
        } catch {
          // Response is not JSON, use statusText
        }
        alert(`❌ Delete failed: ${errMsg}`);
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
    setDeleteLoading(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-emerald-50 to-teal-50 pt-10 lg:pt-16">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-linear-to-r from-emerald-700 to-teal-600 text-white shadow-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-8">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
              Verdora Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-emerald-100">
              Welcome, <span className="font-bold">{adminName}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleHomeClick}
              className="flex items-center justify-center gap-2 rounded-lg bg-white/20 px-5 py-2 font-bold text-white transition hover:bg-white/30"
            >
              <HomeIcon className="w-5 h-5" /> Home
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-bold transition"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* TABS */}
      <nav className="sticky top-10 z-30 border-b-2 border-emerald-200 bg-white shadow-md sm:top-10 lg:top-16">
        <div className="mx-auto flex max-w-7xl gap-0 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {(
            ["overview", "orders", "products", "users", "vendors", "admins", "service-requests", "coupons"] as Tab[]
          ).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSearch("");
                setActiveModal("none");
                if (t === "orders") fetchOrders(token);
                else if (t === "products") fetchProducts(token);
                else if (t === "users") fetchUsers(token);
                else if (t === "vendors") fetchVendors(token);
                else if (t === "admins") fetchAdmins(token);
              }}
              className={`whitespace-nowrap border-b-4 px-5 py-3 text-sm font-bold transition sm:px-6 sm:text-base ${tab === t ? "text-emerald-700 border-emerald-700 bg-emerald-50" : "text-gray-600 border-transparent hover:text-emerald-600"}`}
            >
              {t === "overview" && "📊 Overview"}
              {t === "orders" && "📋 Orders"}
              {t === "products" && "📦 Products"}
              {t === "users" && "👥 Users"}
              {t === "vendors" && "🏪 Vendors"}
              {t === "admins" && "🔐 Admins"}
              {t === "service-requests" && "📞 Service Requests"}
              {t === "coupons" && "🎟️ Coupons"}
            </button>
          ))}
        </div>
      </nav>

      {/* CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {tab === "overview" && (
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-b-4 border-emerald-600">
              <h2 className="text-3xl font-bold text-emerald-700">
                📊 Dashboard Overview
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard title="📦 Products" value={stats.totalProducts} />
              <StatCard title="👥 Users" value={stats.totalUsers} />
              <StatCard title="🏪 Vendors" value={stats.totalVendors} />
              <StatCard title="🔐 Admins" value={stats.totalAdmins} />
              <StatCard title="💰 Revenue" value={stats.totalRevenue} />
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">📋 Orders Management</h2>
            {loading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No orders found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Customer</th>
                      <th className="px-4 py-3 text-left font-semibold">Product</th>
                      <th className="px-4 py-3 text-left font-semibold">Qty</th>
                      <th className="px-4 py-3 text-left font-semibold">Price</th>
                      <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={`${order.orderId}-${order.itemId}`} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{order.customer}</td>
                        <td className="px-4 py-3">{order.productTitle}</td>
                        <td className="px-4 py-3">{order.quantity}</td>
                        <td className="px-4 py-3">₹{order.price}</td>
                        <td className="px-4 py-3">{order.vendorName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'returned' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedItem(order);
                              setActiveModal("orderStatus");
                            }}
                            className="text-blue-600 hover:text-blue-900 font-semibold"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "products" && (
          <TabContent
            title="Products"
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
            data={products}
            loading={loading}
            type="products"
            onEdit={(prod: Product) => {
              setSelectedItem(prod);
              setActiveModal("editProduct");
            }}
            onDelete={(id: string) => handleDelete(id, "product")}
          />
        )}

        {tab === "users" && (
          <TabContent
            title="Users"
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
            data={users}
            loading={loading}
            type="users"
            onEdit={(user: User) => {
              setSelectedItem(user);
              setActiveModal("editUser");
            }}
            onDelete={(id: string) => handleDelete(id, "user")}
          />
        )}

        {tab === "vendors" && (
          <TabContent
            title="Vendors"
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
            onCreate={() => {
              setSelectedItem(null);
              setActiveModal("createVendor");
            }}
            data={vendors}
            loading={loading}
            type="vendors"
            onEdit={(vendor: Vendor) => {
              setSelectedItem(vendor);
              setActiveModal("editVendor");
            }}
            onDelete={(id: string) => handleDelete(id, "vendor")}
          />
        )}

        {tab === "admins" && (
          <TabContent
            title="Admins"
            search={search}
            setSearch={setSearch}
            onSearch={handleSearch}
            onCreate={() => {
              setSelectedItem(null);
              setActiveModal("createAdmin");
            }}
            data={admins}
            loading={loading}
            type="admins"
            onEdit={(admin: Admin) => {
              setSelectedItem(admin);
              setActiveModal("editAdmin");
            }}
            onDelete={(id: string) => handleDelete(id, "admin")}
          />
        )}

        {tab === "service-requests" && (
          <ServiceRequests
            token={token}
            backendUrl={
              typeof window !== "undefined"
                ? process.env.NEXT_PUBLIC_BACKEND_URL ||
                  "https://verdora.onrender.com"
                : "https://verdora.onrender.com"
            }
          />
        )}

        {tab === "coupons" && (
          <CouponManagement
            token={token}
            backendUrl={
              typeof window !== "undefined"
                ? process.env.NEXT_PUBLIC_BACKEND_URL ||
                  "https://verdora.onrender.com"
                : "https://verdora.onrender.com"
            }
          />
        )}
      </main>

      {/* MODALS */}
      {activeModal === "editProduct" &&
        selectedItem &&
        "category" in selectedItem && (
          <Modal title="✏️ Edit Product" onClose={() => setActiveModal("none")}>
            <EditProductForm
              product={selectedItem}
              token={token}
              onSuccess={() => {
                setActiveModal("none");
                fetchProducts(token);
              }}
            />
          </Modal>
        )}
      {activeModal === "editUser" &&
        selectedItem &&
        "mobile" in selectedItem &&
        "email" in selectedItem &&
        "_id" in selectedItem && (
          <Modal title="✏️ Edit User" onClose={() => setActiveModal("none")}>
            <EditUserForm
              user={selectedItem}
              token={token}
              onSuccess={() => {
                setActiveModal("none");
                fetchUsers(token);
              }}
            />
          </Modal>
        )}
      {activeModal === "editVendor" &&
        selectedItem &&
        "businessName" in selectedItem && (
          <Modal title="✏️ Edit Vendor" onClose={() => setActiveModal("none")}>
            <EditVendorForm
              vendor={selectedItem}
              token={token}
              onSuccess={() => {
                setActiveModal("none");
                fetchVendors(token);
              }}
            />
          </Modal>
        )}
      {activeModal === "editAdmin" &&
        selectedItem &&
        "permissions" in selectedItem && (
          <Modal title="✏️ Edit Admin" onClose={() => setActiveModal("none")}>
            <EditAdminForm
              admin={selectedItem}
              token={token}
              onSuccess={() => {
                setActiveModal("none");
                fetchAdmins(token);
              }}
            />
          </Modal>
        )}
      {activeModal === "createUser" && (
        <Modal title="➕ Create User" onClose={() => setActiveModal("none")}>
          <CreateUserForm
            token={token}
            onSuccess={() => {
              setActiveModal("none");
              fetchUsers(token);
            }}
          />
        </Modal>
      )}
      {activeModal === "createVendor" && (
        <Modal title="➕ Create Vendor" onClose={() => {
          setActiveModal("none");
          setVendorRequestData(null);
          setVendorRequestId(null);
        }}>
          <CreateVendorForm
            token={token}
            vendorRequestId={vendorRequestId || undefined}
            prefilledData={vendorRequestData || undefined}
            onSuccess={() => {
              setActiveModal("none");
              setVendorRequestData(null);
              setVendorRequestId(null);
              fetchVendors(token);
            }}
          />
        </Modal>
      )}
      {activeModal === "createAdmin" && (
        <Modal title="➕ Create Admin" onClose={() => setActiveModal("none")}>
          <CreateAdminForm
            token={token}
            onSuccess={() => {
              setActiveModal("none");
              fetchAdmins(token);
            }}
          />
        </Modal>
      )}
      {activeModal === "orderStatus" && selectedItem && "orderId" in selectedItem && (
        <Modal title="📦 Update Order Status" onClose={() => setActiveModal("none")}>
          <OrderStatusForm
            order={selectedItem}
            token={token}
            onSuccess={() => {
              setActiveModal("none");
              fetchOrders(token);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-linear-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200 shadow-lg hover:shadow-xl transition">
      <p className="text-emerald-600 text-sm font-semibold">{title}</p>
      <p className="text-3xl font-bold text-emerald-700 mt-2">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="app-modal-shell">
      <div className="app-modal-card flex w-full max-w-md flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between rounded-t-xl bg-linear-to-r from-emerald-600 to-teal-500 px-5 py-4 text-white sm:px-8 sm:py-6">
          <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

function TabContent<T extends ManageItem>({
  title,
  search,
  setSearch,
  onSearch,
  onCreate,
  data,
  loading,
  type,
  onEdit,
  onDelete,
}: {
  title: string;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  onSearch: () => void;
  onCreate?: () => void;
  data: T[];
  loading: boolean;
  type: DataTab;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
}) {
  const [sortBy, setSortBy] = useState<
    "default" | "name" | "price-low" | "price-high" | "email" | "status"
  >("default");
  const sortedData = useMemo(() => {
    const list = [...data];

    if (type === "products") {
      const productList = list as Product[];
      if (sortBy === "price-low")
        return productList.sort((a, b) => a.price - b.price) as T[];
      if (sortBy === "price-high")
        return productList.sort((a, b) => b.price - a.price) as T[];
      if (sortBy === "name")
        return productList.sort((a, b) => a.name.localeCompare(b.name)) as T[];
      return productList as T[];
    }

    if (type === "users") {
      const userList = list as User[];
      if (sortBy === "name")
        return userList.sort((a, b) => a.name.localeCompare(b.name)) as T[];
      if (sortBy === "email")
        return userList.sort((a, b) => a.email.localeCompare(b.email)) as T[];
      return userList as T[];
    }

    if (type === "vendors") {
      const vendorList = list as Vendor[];
      if (sortBy === "name")
        return vendorList.sort((a, b) =>
          a.username.localeCompare(b.username),
        ) as T[];
      if (sortBy === "email")
        return vendorList.sort((a, b) => a.email.localeCompare(b.email)) as T[];
      if (sortBy === "status")
        return vendorList.sort((a, b) =>
          a.status.localeCompare(b.status),
        ) as T[];
      return vendorList as T[];
    }

    const adminList = list as Admin[];
    if (sortBy === "name")
      return adminList.sort((a, b) =>
        a.username.localeCompare(b.username),
      ) as T[];
    if (sortBy === "email")
      return adminList.sort((a, b) => a.email.localeCompare(b.email)) as T[];
    if (sortBy === "status")
      return adminList.sort((a, b) => a.status.localeCompare(b.status)) as T[];
    return adminList as T[];
  }, [data, sortBy, type]);

  return (
    <div className="space-y-6">
      <div className="mb-6 rounded-lg border-b-4 border-emerald-600 bg-white p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-emerald-700 sm:text-3xl">
            {title}
          </h2>
          {onCreate && (
            <button
              onClick={onCreate}
              className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white transition shadow-md hover:bg-teal-700"
            >
              <PlusIcon className="w-5 h-5" />{" "}
              {type === "products" ? "Add" : "Create"} {title.slice(0, -1)}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          type="text"
          placeholder={`🔍 Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <button
          onClick={onSearch}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-bold text-white transition shadow-md hover:bg-emerald-700"
        >
          <MagnifyingGlassIcon className="w-5 h-5" /> Search
        </button>
        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(
              event.target.value as
                | "default"
                | "name"
                | "price-low"
                | "price-high"
                | "email"
                | "status",
            )
          }
          className="rounded-lg border-2 border-emerald-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="default">Sort: Default</option>
          <option value="name">Sort: Name</option>
          {(type === "products" || type === "admins" || type === "vendors") && (
            <option value={type === "products" ? "price-low" : "status"}>
              {type === "products" ? "Price low-high" : "Status"}
            </option>
          )}
          {type === "products" && (
            <option value="price-high">Price high-low</option>
          )}
          {(type === "users" || type === "vendors" || type === "admins") && (
            <option value="email">Sort: Email</option>
          )}
        </select>
      </div>
      <RenderTable
        type={type}
        data={sortedData}
        loading={loading}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function RenderTable<T extends ManageItem>({
  type,
  data,
  loading,
  onEdit,
  onDelete,
}: {
  type: DataTab;
  data: T[];
  loading: boolean;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
}) {
  if (loading)
    return (
      <div className="text-center py-16 text-gray-500 text-xl">
        ⏳ Loading...
      </div>
    );

  if (data.length === 0)
    return (
      <div className="text-center py-16 text-gray-500 text-lg">
        📭 No data found
      </div>
    );

  const columns =
    type === "products"
      ? ["Product", "Category", "Price", "Vendor", "Business", "Actions"]
      : type === "users"
        ? ["Name", "Email", "Mobile", "Actions"]
        : type === "vendors"
          ? ["Username", "Business", "Status", "Actions"]
          : ["Username", "Email", "Status", "Permissions", "Actions"];

  const renderCells = (item: T): ReactNode[] => {
    if (type === "products") {
      const product = item as Product;
      return [
        product.name,
        product.category,
        `₹${product.price}`,
        product.vendorName,
        product.vendorId?.businessName || "N/A",
      ];
    }

    if (type === "users") {
      const user = item as User;
      return [user.name, user.email, user.mobile];
    }

    if (type === "vendors") {
      const vendor = item as Vendor;
      return [
        vendor.username,
        vendor.businessName || "N/A",
        <span
          key="status"
          className={`px-3 py-1 rounded-full text-sm font-bold ${
            vendor.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {vendor.status}
        </span>,
      ];
    }

    const admin = item as Admin;
    return [
      admin.username,
      admin.email,
      <span
        key="status"
        className={`px-3 py-1 rounded-full text-sm font-bold ${
          admin.status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {admin.status}
      </span>,
      <div key="perms" className="flex flex-wrap gap-1">
        {admin.permissions?.canManageProducts && (
          <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
            Prod
          </span>
        )}
        {admin.permissions?.canManageUsers && (
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
            Users
          </span>
        )}
        {admin.permissions?.canManageVendors && (
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">
            Vend
          </span>
        )}
        {admin.permissions?.canManageAdmins && (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
            Admin
          </span>
        )}
      </div>,
    ];
  };

  const getId = (item: T & { id?: string; _id: string }) => item.id || item._id;

  return (
    <>
      <div className="space-y-3 md:hidden">
        {data.map((item) => {
          const cells = renderCells(item);
          return (
            <div
              key={getId(item)}
              className="rounded-2xl border-2 border-emerald-100 bg-white p-4 shadow-lg"
            >
              <div className="space-y-2 text-sm">
                {columns.slice(0, cells.length).map((label, index) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="text-xs font-semibold uppercase text-gray-500">
                      {label}
                    </span>
                    <div className="text-right text-gray-900">
                      {cells[index]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onEdit(item)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-yellow-500 px-3 py-2 text-sm font-bold text-white transition shadow-md hover:bg-yellow-600"
                >
                  <PencilIcon className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => onDelete(getId(item))}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-bold text-white transition shadow-md hover:bg-red-600"
                >
                  <TrashIcon className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border-2 border-emerald-100 bg-white shadow-lg md:block">
        <table className="w-full">
          <thead className="bg-linear-to-r from-emerald-600 to-teal-500 text-white">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left font-bold text-sm uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const cells = renderCells(item);
              return (
                <tr
                  key={getId(item)}
                  className={`border-b-2 border-emerald-100 ${
                    idx % 2 === 0 ? "bg-white" : "bg-emerald-50"
                  } hover:bg-emerald-100 transition`}
                >
                  {cells.map((cell, i) => (
                    <td key={i} className="px-6 py-5 text-sm">
                      {cell}
                    </td>
                  ))}
                  <td className="px-6 py-5 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg font-bold text-sm transition shadow-md"
                      >
                        <PencilIcon className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => onDelete(getId(item))}
                        className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-sm transition shadow-md"
                      >
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function EditProductForm({
  product,
  token,
  onSuccess,
}: {
  product: Product;
  token: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: product?.category || "",
    brand: product?.brand || "",
    price: product?.price || 0,
    mrp: product?.mrp || 0,
    vendorName: product?.vendorName || "",
    description: product?.description || "",
    image: product?.image || "",
    tags: product?.tags?.join(", ") || "",
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (
        !formData.name ||
        !formData.price ||
        !formData.mrp ||
        !formData.category
      ) {
        alert("❌ Name, category, price, and MRP are required");
        setLoading(false);
        return;
      }

      const endpoint = `/api/admin/manage/products/${product._id || product.id}`;

      // Parse tags from comma-separated string
      const submittedData = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(",").map((tag: string) => tag.trim()).filter((tag: string) => tag)
          : [],
      };

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submittedData),
      });

      if (res.ok) {
        alert("✅ Product updated successfully!");
        onSuccess();
      } else {
        const errMsg = await res.text();
        alert(`❌ Update failed: ${errMsg || res.statusText}`);
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
    setLoading(false);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-96 overflow-y-auto"
    >
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Product Name"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="text"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        placeholder="Category"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="text"
        value={formData.brand || ""}
        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
        placeholder="Brand"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="number"
        value={formData.price}
        onChange={(e) =>
          setFormData({ ...formData, price: Number(e.target.value) })
        }
        placeholder="Price"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="number"
        value={formData.mrp}
        onChange={(e) =>
          setFormData({ ...formData, mrp: Number(e.target.value) })
        }
        placeholder="MRP"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="text"
        value={formData.vendorName || ""}
        onChange={(e) =>
          setFormData({ ...formData, vendorName: e.target.value })
        }
        placeholder="Vendor Name"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <textarea
        value={formData.description || ""}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="Description"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
        rows={3}
      />
      <input
        type="text"
        value={formData.image || ""}
        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
        placeholder="Image URL"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="text"
        value={formData.tags}
        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
        placeholder="Tags (comma-separated, e.g: indoor, flowering, easy-care)"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-bold transition shadow-md"
      >
        {loading ? "⏳ Updating..." : "✅ Update"}
      </button>
    </form>
  );
}

function EditUserForm({
  user,
  token,
  onSuccess,
}: {
  user: User;
  token: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
    gender: user?.gender || "",
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.name || !formData.email || !formData.mobile) {
        alert("❌ All fields are required");
        setLoading(false);
        return;
      }

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/manage/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("✅ User updated successfully!");
        onSuccess();
      } else {
        const errMsg = await res.text();
        alert(`❌ Update failed: ${errMsg || res.statusText}`);
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
    setLoading(false);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="tel"
        value={formData.mobile}
        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
        placeholder="Mobile"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="date"
        value={formData.dob}
        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
        placeholder="Date of Birth"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <select
        value={formData.gender}
        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-bold transition shadow-md"
      >
        {loading ? "⏳ Updating..." : "✅ Update"}
      </button>
    </form>
  );
}

function EditVendorForm({
  vendor,
  token,
  onSuccess,
}: {
  vendor: Vendor;
  token: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    username: vendor?.username || "",
    vendorName: vendor?.vendorName || "",
    email: vendor?.email || "",
    mobileNumber: vendor?.mobileNumber || "",
    businessName: vendor?.businessName || "",
    businessDescription: vendor?.businessDescription || "",
    businessPhone: vendor?.businessPhone || "",
    businessLocation: vendor?.businessLocation || "",
    businessWebsite: vendor?.businessWebsite || "",
    businessLogo: vendor?.businessLogo || "",
    status: vendor?.status || "active",
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.email || !formData.status || !formData.businessName) {
        alert("❌ Email, business name, and status are required");
        setLoading(false);
        return;
      }

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/manage/vendors/${vendor._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("✅ Vendor updated successfully!");
        onSuccess();
      } else {
        const errMsg = await res.text();
        alert(`❌ Update failed: ${errMsg || res.statusText}`);
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
    setLoading(false);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[600px] overflow-y-auto pr-2"
    >
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="Username"
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
        />
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
          required
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={formData.vendorName}
          onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
          placeholder="Vendor Name"
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
        />
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          placeholder="Business Name"
          required
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="tel"
          value={formData.mobileNumber}
          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
          placeholder="Mobile Number"
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
        />
        <input
          type="tel"
          value={formData.businessPhone}
          onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
          placeholder="Business Phone"
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
        />
      </div>

      <input
        type="text"
        value={formData.businessLocation}
        onChange={(e) => setFormData({ ...formData, businessLocation: e.target.value })}
        placeholder="Business Location/Address"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
      />

      <input
        type="url"
        value={formData.businessWebsite}
        onChange={(e) => setFormData({ ...formData, businessWebsite: e.target.value })}
        placeholder="Business Website (optional)"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
      />

      <input
        type="url"
        value={formData.businessLogo}
        onChange={(e) => setFormData({ ...formData, businessLogo: e.target.value })}
        placeholder="Business Logo URL (optional)"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
      />

      <textarea
        value={formData.businessDescription}
        onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
        placeholder="Business Description (optional)"
        disabled={loading}
        rows={3}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 resize-none text-sm"
      />

      <select
        value={formData.status}
        onChange={(e) =>
          setFormData({
            ...formData,
            status: e.target.value as "active" | "inactive",
          })
        }
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
      >
        <option value="active">🟢 Active</option>
        <option value="inactive">🔴 Inactive</option>
      </select>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-bold transition shadow-md text-sm"
      >
        {loading ? "⏳ Updating..." : "✅ Update Vendor"}
      </button>
    </form>
  );
}

function EditAdminForm({
  admin,
  token,
  onSuccess,
}: {
  admin: Admin;
  token: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    username: admin?.username || "",
    email: admin?.email || "",
    status: admin?.status || "active",
    permissions: admin?.permissions || {
      canManageProducts: true,
      canManageUsers: true,
      canManageVendors: true,
      canManageAdmins: false,
      canViewReports: true,
      canManageSettings: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.username || !formData.email || !formData.status) {
        alert("❌ Username, email, and status are required");
        setLoading(false);
        return;
      }

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/manage/admins/${admin._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("✅ Admin updated successfully!");
        onSuccess();
      } else {
        const errMsg = await res.text();
        alert(`❌ Update failed: ${errMsg || res.statusText}`);
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
    setLoading(false);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[600px] overflow-y-auto pr-2"
    >
      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="Username"
          required
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
        />
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
          required
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
        />
      </div>

      <select
        value={formData.status}
        onChange={(e) =>
          setFormData({
            ...formData,
            status: e.target.value as "active" | "inactive",
          })
        }
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 text-sm"
      >
        <option value="active">🟢 Active</option>
        <option value="inactive">🔴 Inactive</option>
      </select>

      <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-300">
        <p className="text-sm font-bold text-emerald-700 mb-4">👮 Admin Permissions:</p>
        <div className="space-y-2">
          {adminPermissionKeys.map((perm) => (
            <label key={perm} className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded transition">
              <input
                type="checkbox"
                checked={formData.permissions?.[perm] ?? false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      [perm]: e.target.checked,
                    },
                  })
                }
                disabled={loading}
                className="w-4 h-4 accent-emerald-600 rounded disabled:opacity-50 cursor-pointer"
              />
              <span className="text-sm text-gray-700 capitalize">
                {perm
                  .replace(/([A-Z])/g, " $1")
                  .trim()
                  .replace(/^./, (str) => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-bold transition shadow-md text-sm"
      >
        {loading ? "⏳ Updating..." : "✅ Update Admin"}
      </button>
    </form>
  );
}

function CreateUserForm({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (
        !formData.name ||
        !formData.email ||
        !formData.mobile ||
        !formData.password
      ) {
        alert("❌ All fields are required");
        setLoading(false);
        return;
      }

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/manage/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("✅ User created successfully!");
        onSuccess();
      } else {
        const errMsg = await res.text();
        alert(`❌ Creation failed: ${errMsg || res.statusText}`);
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
    setLoading(false);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-96 overflow-y-auto"
    >
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Full Name"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="tel"
        value={formData.mobile}
        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
        placeholder="Mobile"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-bold transition shadow-md"
      >
        {loading ? "⏳ Creating..." : "✅ Create"}
      </button>
    </form>
  );
}

function CreateVendorForm({
  token,
  onSuccess,
  vendorRequestId,
  prefilledData,
}: {
  token: string;
  onSuccess: () => void;
  vendorRequestId?: string;
  prefilledData?: VendorPrefillData;
}) {
  const [formData, setFormData] = useState({
    username: prefilledData?.username || "",
    email: prefilledData?.email || "",
    password: "",
    vendorName: prefilledData?.vendorName || "",
    mobileNumber: prefilledData?.mobileNumber || prefilledData?.phone || "",
    businessName: prefilledData?.businessName || prefilledData?.shopName || "",
    businessPhone: prefilledData?.businessPhone || prefilledData?.phone || "",
    businessLocation: prefilledData?.businessLocation || prefilledData?.address || "",
    businessWebsite: prefilledData?.businessWebsite || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Validation
      if (!formData.username || !formData.email || !formData.password || !formData.businessName) {
        setError("❌ Username, email, password, and business name are required");
        setLoading(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("❌ Invalid email format");
        setLoading(false);
        return;
      }

      // Username validation (alphanumeric and underscore only)
      const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
      if (!usernameRegex.test(formData.username)) {
        setError("❌ Username must be 3+ characters (alphanumeric and underscore only)");
        setLoading(false);
        return;
      }

      // Password strength check
      if (formData.password.length < 6) {
        setError("❌ Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      
      const endpoint = vendorRequestId 
        ? `${BACKEND_URL}/api/admin/vendor-requests/${vendorRequestId}/accept-with-vendor`
        : `${BACKEND_URL}/api/admin/manage/vendors`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert(vendorRequestId ? "✅ Vendor request accepted and vendor created!" : "✅ Vendor created successfully!");
        onSuccess();
      } else {
        const errorMessage = data.message || data.error || res.statusText;
        setError(`❌ ${errorMessage}`);
      }
    } catch (err) {
      setError(`❌ Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 max-h-96 overflow-y-auto"
    >
      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
        <p className="text-xs text-emerald-700 font-semibold">
          {vendorRequestId ? "✅ Accepting vendor request & creating account" : "📝 Creating new vendor account"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <input
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        placeholder="Username * (alphanumeric, 3+ chars)"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email *"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password * (6+ chars)"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="text"
        value={formData.vendorName}
        onChange={(e) =>
          setFormData({ ...formData, vendorName: e.target.value })
        }
        placeholder="Vendor Name"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="tel"
        value={formData.mobileNumber}
        onChange={(e) =>
          setFormData({ ...formData, mobileNumber: e.target.value })
        }
        placeholder="Mobile Number"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="text"
        value={formData.businessName}
        onChange={(e) =>
          setFormData({ ...formData, businessName: e.target.value })
        }
        placeholder="Business Name *"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="tel"
        value={formData.businessPhone}
        onChange={(e) =>
          setFormData({ ...formData, businessPhone: e.target.value })
        }
        placeholder="Business Phone"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="text"
        value={formData.businessLocation}
        onChange={(e) =>
          setFormData({ ...formData, businessLocation: e.target.value })
        }
        placeholder="Business Location"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="url"
        value={formData.businessWebsite}
        onChange={(e) =>
          setFormData({ ...formData, businessWebsite: e.target.value })
        }
        placeholder="Business Website (optional)"
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-bold transition shadow-md"
      >
        {loading ? "⏳ Processing..." : vendorRequestId ? "✅ Accept & Create" : "✅ Create"}
      </button>
    </form>
  );
}

function CreateAdminForm({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    permissions: {
      canManageProducts: true,
      canManageUsers: true,
      canManageVendors: true,
      canManageAdmins: false,
      canViewReports: true,
      canManageSettings: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.username || !formData.email || !formData.password) {
        alert("❌ Username, email, and password are required");
        setLoading(false);
        return;
      }

      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/admin/manage/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("✅ Admin created successfully!");
        onSuccess();
      } else {
        const errMsg = await res.text();
        alert(`❌ Creation failed: ${errMsg || res.statusText}`);
      }
    } catch (err) {
      alert(`❌ Error: ${(err as Error).message}`);
    }
    setLoading(false);
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 max-h-96 overflow-y-auto"
    >
      <input
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        placeholder="Username"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
        disabled={loading}
        className="w-full px-4 py-3 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
      />
      <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-300">
        <p className="text-sm font-bold text-emerald-700 mb-3">Permissions:</p>
        <div className="space-y-2">
          {adminPermissionKeys.map((perm) => (
            <label key={perm} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  formData.permissions[
                    perm as keyof typeof formData.permissions
                  ]
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    permissions: {
                      ...formData.permissions,
                      [perm]: e.target.checked,
                    },
                  })
                }
                disabled={loading}
                className="w-4 h-4 accent-emerald-600 rounded disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">
                {perm.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </label>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-bold transition shadow-md"
      >
        {loading ? "⏳ Creating..." : "✅ Create"}
      </button>
    </form>
  );
}
