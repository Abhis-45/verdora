"use client";
import { useState, useEffect } from "react";
import Skeleton from "../shared/Skeleton";
import { TrashIcon } from "@heroicons/react/24/outline";

type Role = "Admin" | "Super Admin";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export default function AdminManager() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<{ name: string; email: string; role: Role }>(
    {
      name: "",
      email: "",
      role: "Admin",
    },
  );

  useEffect(() => {
    // Placeholder API call
    const fetchAdmins = async () => {
      try {
        setAdmins([
          {
            id: "1",
            name: "Super Admin",
            email: "super@verdora.com",
            role: "Super Admin",
          },
          {
            id: "2",
            name: "John Doe",
            email: "john@verdora.com",
            role: "Admin",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAdmin: Admin = { id: Date.now().toString(), ...form };
    setAdmins((prev) => [...prev, newAdmin]);
    setForm({ name: "", email: "", role: "Admin" });
  };

  const handleDelete = (id: string, role: Role) => {
    if (role === "Super Admin") {
      alert("Super Admin cannot be deleted.");
      return;
    }
    if (!confirm("Are you sure you want to delete this admin?")) return;
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Admin Profiles
      </h2>

      {/* Add Admin Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
      >
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          className="border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
        >
          <option value="Admin">Admin</option>
          <option value="Super Admin">Super Admin</option>
        </select>
        <button
          type="submit"
          className="col-span-1 sm:col-span-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + Add Admin
        </button>
      </form>

      {/* Admin List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-full rounded" />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <p className="text-gray-500 text-sm">No admins found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Email", "Role", "Actions"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{admin.name}</td>
                  <td className="px-4 py-2">{admin.email}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        admin.role === "Super Admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {admin.role === "Super Admin" ? (
                      <span className="text-gray-400 text-xs italic">
                        Protected
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDelete(admin.id, admin.role)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                    )}
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
