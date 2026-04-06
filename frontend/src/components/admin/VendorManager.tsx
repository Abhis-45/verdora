"use client";
import { useState, useEffect } from "react";
import Skeleton from "../shared/Skeleton";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  Vendor,
  fetchVendors,
  addVendor,
  updateVendor,
  deleteVendor,
} from "@/lib/vendorApi";

export default function VendorManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    category: "",
  });
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    const loadVendors = async () => {
      setIsLoading(true);
      const data = await fetchVendors();
      setVendors(data);
      setIsLoading(false);
    };
    loadVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVendor) {
      const updated = await updateVendor(editingVendor.id, form);
      if (updated) {
        setVendors((prev) =>
          prev.map((v) => (v.id === editingVendor.id ? updated : v)),
        );
      }
      setEditingVendor(null);
    } else {
      const newVendor = await addVendor(form);
      if (newVendor) {
        setVendors((prev) => [...prev, newVendor]);
      }
    }
    setForm({ name: "", email: "", location: "", category: "" });
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name,
      email: vendor.email,
      location: vendor.location,
      category: vendor.category,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    const success = await deleteVendor(id);
    if (success) {
      setVendors((prev) => prev.filter((v) => v.id !== id));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Vendor Management
      </h2>

      {/* Add/Edit Vendor Form */}
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
        <input
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
        />
        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
        />
        <button
          type="submit"
          className="col-span-1 sm:col-span-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {editingVendor ? "Update Vendor" : "+ Add Vendor"}
        </button>
      </form>

      {/* Vendor List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-full rounded" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <p className="text-gray-500 text-sm">No vendors found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Email", "Location", "Category", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{vendor.name}</td>
                  <td className="px-4 py-2">{vendor.email}</td>
                  <td className="px-4 py-2">{vendor.location}</td>
                  <td className="px-4 py-2">{vendor.category}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <PencilIcon className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <TrashIcon className="w-4 h-4" /> Delete
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
