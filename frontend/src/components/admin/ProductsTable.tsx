/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import Skeleton from "../shared/Skeleton";
import Link from "next/link";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function ProductsTable({
  products,
  onDelete,
  isLoading,
}: {
  products: any[];
  onDelete: (id: string) => void;
  isLoading?: boolean;
}) {
  const [sortBy, setSortBy] = useState("latest");
  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "price-low") return list.sort((a, b) => a.price - b.price);
    if (sortBy === "price-high") return list.sort((a, b) => b.price - a.price);
    if (sortBy === "name")
      return list.sort((a, b) => a.name.localeCompare(b.name));
    return list.sort((a, b) =>
      String(b._id || "").localeCompare(String(a._id || "")),
    );
  }, [products, sortBy]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="latest">Newest</option>
            <option value="name">Name A-Z</option>
            <option value="price-low">Price Low-High</option>
            <option value="price-high">Price High-Low</option>
          </select>
        </div>
        <Link
          href="/admin/products/add"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
        >
          <PlusIcon className="w-5 h-5" /> Add Product
        </Link>
      </div>
      <div className="p-4 md:hidden">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
            No products found
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProducts.map((product) => (
              <div
                key={product._id}
                className="rounded-2xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">
                      {product.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {product.category}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <span className="font-semibold text-green-600">
                        Rs. {product.price}
                      </span>
                      <span className="text-gray-500">MRP {product.mrp}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/admin/products/${product._id}/edit`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-blue-700"
                  >
                    <PencilIcon className="w-4 h-4" /> Edit
                  </Link>
                  <button
                    onClick={() => onDelete(product._id)}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="hidden overflow-x-auto md:block">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Product", "Category", "Price", "MRP", "Actions"].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <span className="ml-4 font-medium text-gray-900">
                        {product.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      ₹{product.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ₹{product.mrp}
                    </td>
                    <td className="px-6 py-4 text-sm flex gap-2">
                      <Link
                        href={`/admin/products/${product._id}/edit`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <PencilIcon className="w-4 h-4" /> Edit
                      </Link>
                      <button
                        onClick={() => onDelete(product._id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <TrashIcon className="w-4 h-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
