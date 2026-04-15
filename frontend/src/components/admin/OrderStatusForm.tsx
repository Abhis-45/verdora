import { FormEvent, useState } from "react";

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

export default function OrderStatusForm({
  order,
  token,
  onSuccess,
}: {
  order: OrderItem;
  token: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    newStatus: order.status,
    reason: "",
  });
  const [loading, setLoading] = useState(false);

  const statusOptions: { value: string; label: string; color: string }[] = [
    { value: "pending", label: "Pending", color: "bg-yellow-100" },
    { value: "accepted", label: "Accepted", color: "bg-blue-100" },
    { value: "ready_to_ship", label: "Ready to Ship", color: "bg-amber-100" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100" },
    { value: "shipped", label: "Shipped", color: "bg-blue-200" },
    { value: "delivered", label: "Delivered", color: "bg-green-100" },
    { value: "returned", label: "Returned", color: "bg-orange-100" },
    { value: "replaced", label: "Replaced", color: "bg-purple-100" },
    { value: "refunded", label: "Refunded", color: "bg-pink-100" },
  ];

  // Determine valid next statuses based on current status
  const getValidNextStatuses = (currentStatus: string) => {
    const statusTransitions: { [key: string]: string[] } = {
      pending: ["accepted", "cancelled"],
      accepted: ["ready_to_ship", "cancelled"],
      ready_to_ship: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["returned", "replaced", "refunded"],
      cancelled: [],
      returned: [],
      replaced: [],
      refunded: [],
    };
    return statusTransitions[currentStatus] || [];
  };

  const validNextStatuses = getValidNextStatuses(order.status);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validNextStatuses.includes(formData.newStatus)) {
      alert("❌ Invalid status transition");
      return;
    }

    setLoading(true);
    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const res = await fetch(
        `${BACKEND_URL}/api/admin/manage/orders/${order.orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            itemId: order.itemId,
            newStatus: formData.newStatus,
            reason: formData.reason,
          }),
        }
      );

      if (res.ok) {
        alert("✅ Order status updated successfully!");
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
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📦 Order ID
        </label>
        <input
          type="text"
          value={order.orderId}
          disabled
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          📝 Product
        </label>
        <input
          type="text"
          value={order.productTitle}
          disabled
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📊 Current Status
          </label>
          <input
            type="text"
            value={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            disabled
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ✅ New Status
          </label>
          <select
            value={formData.newStatus}
            onChange={(e) =>
              setFormData({ ...formData, newStatus: e.target.value })
            }
            disabled={loading || validNextStatuses.length === 0}
            className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100"
          >
            <option value="">-- Select Status --</option>
            {validNextStatuses.map((status) => {
              const option = statusOptions.find((o) => o.value === status);
              return (
                <option key={status} value={status}>
                  {option?.label || status}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          💬 Reason/Notes (Optional)
        </label>
        <textarea
          value={formData.reason}
          onChange={(e) =>
            setFormData({ ...formData, reason: e.target.value })
          }
          placeholder="Enter reason for status change (e.g., 'Customer requested cancellation')..."
          disabled={loading}
          rows={3}
          className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-gray-100 resize-none"
        />
      </div>

      {validNextStatuses.length === 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
          <p className="text-sm text-red-700">
            ⚠️ No valid status transitions available for this order status.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={
          loading || !formData.newStatus || validNextStatuses.length === 0
        }
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-bold transition shadow-md"
      >
        {loading ? "⏳ Updating..." : "✅ Update Status"}
      </button>
    </form>
  );
}
