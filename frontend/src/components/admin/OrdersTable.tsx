/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { formatDeliveryDate } from "@/utils/delivery";
import Skeleton from "../shared/Skeleton";

const ORDER_STATUSES = [
  "accepted",
  "shipped",
  "delivered",
  "returned",
  "replaced",
  "refunded",
];

export default function OrdersTable({
  orders,
  isLoading,
  updatingOrderId,
  onUpdateStatus,
}: {
  orders: any[];
  isLoading: boolean;
  updatingOrderId?: string | null;
  onUpdateStatus: (orderId: string, status: string) => void;
}) {
  const [sortBy, setSortBy] = useState("latest");
  const sortedOrders = useMemo(() => {
    const list = [...orders];
    if (sortBy === "oldest") {
      return list.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }
    if (sortBy === "total-high") {
      return list.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
    }
    if (sortBy === "status") {
      return list.sort((a, b) =>
        (a.status || "").localeCompare(b.status || ""),
      );
    }
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [orders, sortBy]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <Skeleton className="mb-4 h-6 w-40" />
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} className="mb-2 h-5 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 text-gray-500 shadow">
        No orders found
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="latest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="total-high">Highest total</option>
          <option value="status">Status</option>
        </select>
      </div>
      <div className="space-y-3 p-4 md:hidden">
        {sortedOrders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">
                  #{order.id?.slice(-6)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(order.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="text-sm font-semibold text-green-700">
                Rs. {Number(order.total || 0).toFixed(2)}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-medium text-gray-900">{order.customer}</p>
              <p className="text-gray-500">{order.email || order.mobile}</p>
              <p className="text-blue-700">
                {order.deliveryEstimate?.estimatedDeliveryDate
                  ? formatDeliveryDate(
                      order.deliveryEstimate.estimatedDeliveryDate,
                    )
                  : "Delivery not set"}
              </p>
            </div>
            <select
              value={order.status}
              onChange={(event) => onUpdateStatus(order.id, event.target.value)}
              disabled={updatingOrderId === order.id}
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Delivery
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">
                    #{order.id?.slice(-6)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {order.itemsCount} item{order.itemsCount !== 1 ? "s" : ""}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    {order.customer}
                  </div>
                  <div className="text-xs text-gray-500">{order.email}</div>
                  <div className="text-xs text-gray-500">{order.mobile}</div>
                </td>
                <td className="px-6 py-4 font-semibold text-green-700">
                  ₹{Number(order.total || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-blue-700">
                  {order.deliveryEstimate?.estimatedDeliveryDate
                    ? formatDeliveryDate(
                        order.deliveryEstimate.estimatedDeliveryDate,
                      )
                    : "Not set"}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={order.status}
                    onChange={(event) =>
                      onUpdateStatus(order.id, event.target.value)
                    }
                    disabled={updatingOrderId === order.id}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {order.statusReason && (
                    <div className="mt-2 text-xs text-gray-500">
                      {order.statusReason}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
