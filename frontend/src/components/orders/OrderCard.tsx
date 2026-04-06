import { Order } from "@/types/user";

export default function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const statusColors: Record<string, string> = {
    delivered: "bg-green-100 text-green-700",
    shipped: "bg-blue-100 text-blue-700",
    pending: "bg-yellow-100 text-yellow-700",
    returned: "bg-red-100 text-red-700",
  };

  // Only show one final status
  const finalStatus = order.status === "returned" ? "returned" : order.status;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer p-3 sm:p-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* Order Info */}
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {order.items?.[0]?.title || "Items"}
          </div>
          <div className="text-xs text-gray-500">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </div>
          <div className="text-xs text-gray-400">{formatDate(order.date)}</div>
        </div>

        {/* Price + Status */}
        <div className="text-left sm:text-right">
          <div className="text-base font-bold text-green-900">₹{(order.total || 0).toFixed(2)}</div>
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
              statusColors[finalStatus] || "bg-gray-100 text-gray-700"
            }`}
          >
            {finalStatus?.toUpperCase() || "PENDING"}
          </span>
        </div>
      </div>
    </div>
  );
}