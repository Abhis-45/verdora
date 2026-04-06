/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";

interface Product {
  id: number;
  name: string;
  basePrice: number; // base price, actual price depends on size
}

export default function BulkOrderForm() {
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [products, setProducts] = useState<
    { product: Product; size: string; quantity: number }[]
  >([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : data.products || []).map(
        (p: any) => ({
          id: Number(p.id ?? p._id),
          name: p.name,
          basePrice: p.price,
        }),
      );
      setAvailableProducts(normalized);
    })();
  }, []);

  const filteredProducts = availableProducts.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const addProduct = () => {
    if (!selectedProduct) return;
    setProducts([
      ...products,
      { product: selectedProduct, size: "Medium", quantity: 1 },
    ]);
    setSelectedProduct(null);
    setSearchTerm("");
  };

  const updateQuantity = (i: number, value: number) => {
    const updated = [...products];
    updated[i].quantity = value;
    setProducts(updated);
  };

  const updateSize = (i: number, value: string) => {
    const updated = [...products];
    updated[i].size = value;
    setProducts(updated);
  };

  const removeProduct = (i: number) => {
    setProducts(products.filter((_, idx) => idx !== i));
  };

  // Price multiplier based on size
  const sizeMultiplier = (size: string) => {
    switch (size) {
      case "Small":
        return 1;
      case "Medium":
        return 1.5;
      case "Large":
        return 2;
      default:
        return 1;
    }
  };

  const totalPrice = products.reduce(
    (sum, p) => sum + p.product.basePrice * sizeMultiplier(p.size) * p.quantity,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      company,
      contact,
      email,
      details,
      products: products.map((p) => ({
        id: p.product.id,
        name: p.product.name,
        size: p.size,
        quantity: p.quantity,
        price: p.product.basePrice * sizeMultiplier(p.size),
      })),
    };
    await fetch("/api/sendCorporateInquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    alert("Inquiry submitted!");
  };

  return (
    <section className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">
        Bulk Order Inquiry
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            placeholder="Company Name"
            className="border rounded-md p-3 shadow-sm focus:ring-green-600 focus:border-green-600"
          />
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            placeholder="Contact Person"
            className="border rounded-md p-3 shadow-sm focus:ring-green-600 focus:border-green-600"
          />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email"
          className="w-full border rounded-md p-3 shadow-sm focus:ring-green-600 focus:border-green-600"
        />

        {/* Search + Add in same line */}
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product..."
            className="flex-1 border rounded-md p-3 shadow-sm focus:ring-green-600 focus:border-green-600"
          />
          <button
            type="button"
            onClick={addProduct}
            disabled={!selectedProduct}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-md transition disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {searchTerm && (
          <ul className="border rounded-md mt-2 max-h-40 overflow-y-auto shadow-sm">
            {filteredProducts.map((prod) => (
              <li
                key={prod.id}
                onClick={() => setSelectedProduct(prod)}
                className={`px-3 py-2 cursor-pointer hover:bg-green-100 ${
                  selectedProduct?.id === prod.id
                    ? "bg-green-50 font-semibold"
                    : ""
                }`}
              >
                {prod.name}
              </li>
            ))}
            {filteredProducts.length === 0 && (
              <li className="px-3 py-2 text-gray-500">No products found</li>
            )}
          </ul>
        )}

        {/* Customization */}
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          placeholder="Packaging, branding, delivery preferences..."
          className="w-full border rounded-md p-3 shadow-sm focus:ring-green-600 focus:border-green-600"
        />

        {/* Summary */}
        {products.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-green-700 mb-3">
              Order Summary
            </h3>

            {/* Responsive wrapper */}
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200 rounded-md shadow-sm text-sm">
                <thead className="bg-green-50">
                  <tr>
                    <th className="border px-3 py-2 text-left">Product</th>
                    <th className="border px-3 py-2 text-center">Size</th>
                    <th className="border px-3 py-2 text-center">Qty</th>
                    <th className="border px-3 py-2 text-right">Subtotal</th>
                    <th className="border px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const subtotal =
                      p.product.basePrice * sizeMultiplier(p.size) * p.quantity;
                    return (
                      <tr key={i} className="hover:bg-green-50">
                        <td className="border px-3 py-2">{p.product.name}</td>
                        <td className="border px-3 py-2 text-center">
                          <select
                            value={p.size}
                            onChange={(e) => updateSize(i, e.target.value)}
                            className="border rounded-md p-1 w-full sm:w-auto"
                          >
                            <option>Small</option>
                            <option>Medium</option>
                            <option>Large</option>
                          </select>
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={p.quantity}
                            onChange={(e) =>
                              updateQuantity(i, Number(e.target.value))
                            }
                            className="w-16 border rounded-md p-1 text-center"
                          />
                        </td>
                        <td className="border px-3 py-2 text-right">
                          ₹{subtotal.toLocaleString()}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeProduct(i)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-green-100 font-semibold">
                    <td className="border px-3 py-2 text-right" colSpan={3}>
                      Estimated Total
                    </td>
                    <td className="border px-3 py-2 text-right">
                      ₹{totalPrice.toLocaleString()}
                    </td>
                    <td className="border px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="text-center mt-6">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-md shadow-md transition"
          >
            Submit Inquiry
          </button>
        </div>
      </form>
    </section>
  );
}
