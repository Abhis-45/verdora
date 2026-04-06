"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import UsersTable from "@/components/admin/UsersTable";
import { fetchUsers, User } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const data = await fetchUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch {
        setUsers([]); // fallback
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

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
          <UsersTable users={users} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}
