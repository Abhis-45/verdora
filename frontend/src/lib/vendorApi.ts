// lib/vendorApi.ts
// Centralized API service for vendor management

export interface Vendor {
  id: string;
  name: string;
  email: string;
  location: string;
  category: string;
}

// Base URL (adjust for your backend)
const BASE_URL = "/api"; // Use Next.js proxy instead of direct backend connection
const DEFAULT_TIMEOUT = 10000;

// Helper function to create timeout promise
function withTimeout<T>(
  promise: Promise<T>,
  ms: number = DEFAULT_TIMEOUT,
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), ms),
  );
  return Promise.race([promise, timeoutPromise]);
}

// Fetch all vendors
export async function fetchVendors(): Promise<Vendor[]> {
  try {
    const response = await withTimeout(fetch(`${BASE_URL}/api/vendors`));
    if (!response.ok) throw new Error("Failed to fetch vendors");
    const data = await response.json();
    return Array.isArray(data) ? data : data.vendors || [];
  } catch (error) {
    console.error("Failed to fetch vendors:", error);
    return [];
  }
}

// Add a new vendor
export async function addVendor(
  vendor: Omit<Vendor, "id">,
): Promise<Vendor | null> {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await withTimeout(
      fetch(`${BASE_URL}/api/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(vendor),
      }),
    );
    if (!response.ok) throw new Error("Failed to add vendor");
    return await response.json();
  } catch (error) {
    console.error("Failed to add vendor:", error);
    return null;
  }
}

// Update vendor
export async function updateVendor(
  id: string,
  vendor: Partial<Vendor>,
): Promise<Vendor | null> {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await withTimeout(
      fetch(`${BASE_URL}/api/vendors/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(vendor),
      }),
    );
    if (!response.ok) throw new Error("Failed to update vendor");
    return await response.json();
  } catch (error) {
    console.error("Failed to update vendor:", error);
    return null;
  }
}

// Delete vendor
export async function deleteVendor(id: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("adminToken");
    const response = await withTimeout(
      fetch(`${BASE_URL}/api/vendors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }),
    );
    if (!response.ok) throw new Error("Failed to delete vendor");
    return true;
  } catch (error) {
    console.error("Failed to delete vendor:", error);
    return false;
  }
}
