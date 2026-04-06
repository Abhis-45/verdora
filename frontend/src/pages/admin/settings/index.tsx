"use client";
import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import AdminManager from "@/components/admin/AdminManager";
import VendorManager from "@/components/admin/VendorManager";

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <main className="grid min-w-0 flex-1 grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-2 lg:gap-8">
          {/* Left column: Admin profiles */}
          <AdminManager />

          {/* Right column: Vendor management */}
          <VendorManager />
        </main>
      </div>
    </div>
  );
}
