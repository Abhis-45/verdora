"use client";
import { useState, useEffect, useCallback } from "react";
import { TrashIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import Skeleton from "../shared/Skeleton";

interface Coupon {
  _id: string;
  couponCode: string;
  fixedDiscount: number;
  percentageDiscount: number;
  maxDiscountAmount: number;
  minCartValue: number;
  status: "active" | "inactive";
  showOnCartPage: boolean;
  maxUsagePerUser: number;
  totalUses: number;
  totalDiscountGiven: number;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CouponForm {
  couponCode: string;
  fixedDiscount: number | string;
  percentageDiscount: number | string;
  maxDiscountAmount: number | string;
  minCartValue: number | string;
  status: "active" | "inactive";
  showOnCartPage: boolean;
  maxUsagePerUser: number | string;
  expiryDate: string;
}

export default function CouponManagement({
  token,
  backendUrl,
}: {
  token: string;
  backendUrl: string;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CouponForm>({
    couponCode: "",
    fixedDiscount: "",
    percentageDiscount: "",
    maxDiscountAmount: "",
    minCartValue: "",
    status: "active",
    showOnCartPage: false,
    maxUsagePerUser: 1,
    expiryDate: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch coupons
  const fetchCoupons = useCallback(
    async (searchTerm = "") => {
      setLoading(true);
      try {
        const url = new URL(`${backendUrl}/api/coupons`);
        if (searchTerm) url.searchParams.append("search", searchTerm);

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
        } else {
          setError("Failed to fetch coupons");
        }
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    },
    [token, backendUrl]
  );

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleSearch = () => {
    fetchCoupons(search);
  };

  const resetForm = () => {
    setForm({
      couponCode: "",
      fixedDiscount: "",
      percentageDiscount: "",
      maxDiscountAmount: "",
      minCartValue: "",
      status: "active",
      showOnCartPage: false,
      maxUsagePerUser: 1,
      expiryDate: "",
    });
    setEditingId(null);
    setError("");
    setSuccess("");
  };

  const handleEdit = (coupon: Coupon) => {
    setForm({
      couponCode: coupon.couponCode,
      fixedDiscount: coupon.fixedDiscount,
      percentageDiscount: coupon.percentageDiscount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minCartValue: coupon.minCartValue,
      status: coupon.status,
      showOnCartPage: coupon.showOnCartPage,
      maxUsagePerUser: coupon.maxUsagePerUser,
      expiryDate: coupon.expiryDate
        ? new Date(coupon.expiryDate).toISOString().split("T")[0]
        : "",
    });
    setEditingId(coupon._id);
    setShowForm(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate
    if (!form.couponCode.trim()) {
      setError("Coupon code is required");
      return;
    }

    const fixedDisc = parseFloat(String(form.fixedDiscount));
    const percentDisc = parseFloat(String(form.percentageDiscount));

    if (isNaN(fixedDisc) && isNaN(percentDisc)) {
      setError("Either fixed discount or percentage discount must be provided");
      return;
    }

    if (
      (percentDisc && (percentDisc < 0 || percentDisc > 100)) ||
      (fixedDisc && fixedDisc < 0)
    ) {
      setError("Invalid discount values");
      return;
    }

    const payload = {
      couponCode: form.couponCode.toUpperCase(),
      fixedDiscount: isNaN(fixedDisc) ? 0 : fixedDisc,
      percentageDiscount: isNaN(percentDisc) ? 0 : percentDisc,
      maxDiscountAmount: parseFloat(String(form.maxDiscountAmount)) || 0,
      minCartValue: parseFloat(String(form.minCartValue)) || 0,
      status: form.status,
      showOnCartPage: form.showOnCartPage,
      maxUsagePerUser: parseInt(String(form.maxUsagePerUser)) || 1,
      expiryDate: form.expiryDate || null,
    };

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${backendUrl}/api/coupons/${editingId}`
        : `${backendUrl}/api/coupons`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(
          editingId ? "Coupon updated successfully" : "Coupon created successfully"
        );
        resetForm();
        setShowForm(false);
        await fetchCoupons(search);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to save coupon");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;

    try {
      const res = await fetch(`${backendUrl}/api/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setSuccess("Coupon deleted successfully");
        await fetchCoupons(search);
      } else {
        setError("Failed to delete coupon");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">🎟️ Discount Coupons</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition"
        >
          <PlusIcon className="w-5 h-5" /> New Coupon
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-green-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            {editingId ? "✏️ Edit Coupon" : "➕ Create New Coupon"}
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coupon Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                value={form.couponCode}
                onChange={(e) =>
                  setForm({ ...form, couponCode: e.target.value.toUpperCase() })
                }
                placeholder="e.g., SUMMER20"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
                required
              />
            </div>

            {/* Fixed Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fixed Discount Amount (₹)
              </label>
              <input
                type="number"
                value={form.fixedDiscount}
                onChange={(e) =>
                  setForm({ ...form, fixedDiscount: e.target.value })
                }
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Percentage Discount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Percentage Discount (%)
              </label>
              <input
                type="number"
                value={form.percentageDiscount}
                onChange={(e) =>
                  setForm({ ...form, percentageDiscount: e.target.value })
                }
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Max Discount Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upto Amount (₹) - Max Discount Limit
              </label>
              <input
                type="number"
                value={form.maxDiscountAmount}
                onChange={(e) =>
                  setForm({ ...form, maxDiscountAmount: e.target.value })
                }
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Min Cart Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Cart Value (₹)
              </label>
              <input
                type="number"
                value={form.minCartValue}
                onChange={(e) =>
                  setForm({ ...form, minCartValue: e.target.value })
                }
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Max Usage Per User */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Usage Per User (Restrictions)
              </label>
              <input
                type="number"
                value={form.maxUsagePerUser}
                onChange={(e) =>
                  setForm({ ...form, maxUsagePerUser: e.target.value })
                }
                placeholder="1"
                min="1"
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as "active" | "inactive",
                  })
                }
                className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Show on Cart Page */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="showOnCart"
                checked={form.showOnCartPage}
                onChange={(e) =>
                  setForm({ ...form, showOnCartPage: e.target.checked })
                }
                className="w-5 h-5 border-2 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="showOnCart" className="text-sm font-medium text-gray-700 cursor-pointer">
                Show Coupon on Cart Page
              </label>
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition"
              >
                {editingId ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search coupon code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-green-500"
        />
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          Search
        </button>
      </div>

      {/* Coupons List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {search ? "No coupons found matching your search" : "No coupons created yet"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Discount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Min Cart</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Uses</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Cart Page</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {coupon.couponCode}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {coupon.fixedDiscount > 0 && (
                        <div>₹{coupon.fixedDiscount.toFixed(2)}</div>
                      )}
                      {coupon.percentageDiscount > 0 && (
                        <div>{coupon.percentageDiscount}%</div>
                      )}
                      {coupon.maxDiscountAmount > 0 && (
                        <div className="text-gray-600 text-xs">
                          Max: ₹{coupon.maxDiscountAmount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    ₹{coupon.minCartValue.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        coupon.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{coupon.totalUses} times</div>
                    <div className="text-gray-600 text-xs">
                      Max: {coupon.maxUsagePerUser}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {coupon.showOnCartPage ? (
                      <span className="text-green-600 font-medium">✓ Yes</span>
                    ) : (
                      <span className="text-gray-500">✗ No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id, coupon.couponCode)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
