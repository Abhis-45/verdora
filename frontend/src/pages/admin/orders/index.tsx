/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import OrdersTable from "@/components/admin/OrdersTable";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadOrders = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/manage/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(
        `/api/admin/manage/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status } : order,
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 md:flex">
      <Sidebar className="hidden md:flex md:min-h-screen md:shrink-0" />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <Sidebar
              className="h-full max-w-[85vw] shadow-2xl"
              onLinkClick={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <Header
          onLogout={() => {}}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-500">
              Update lifecycle statuses for customer orders here.
            </p>
          </div>
          <OrdersTable
            orders={orders}
            isLoading={isLoading}
            updatingOrderId={updatingOrderId}
            onUpdateStatus={handleUpdateStatus}
          />
        </main>
      </div>
    </div>
  );
}
