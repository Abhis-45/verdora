// lib/api.ts
// Centralized API service for all admin modules with caching support

import { apiCache, generateCacheKey, invalidateCachePattern, type CacheOptions } from "./apiCache";

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  image: string;
}

export interface Order {
  id: string;
  customer: string;
  total: number;
  status: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  location: string;
  category: string;
}

// Get backend URL from environment or use direct API endpoint
const BACKEND_URL = typeof window !== "undefined" 
  ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
  : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

const BASE_URL = `${BACKEND_URL}/api`;
const DEFAULT_TIMEOUT = 10000;

function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

// Helper function for common fetch pattern with caching support
async function safeFetch<T>(
  url: string,
  options: RequestInit & CacheOptions = {},
): Promise<T | null> {
  try {
    const { skipCache = false, ttl, ...fetchOptions } = options;

    // Check cache for GET requests
    if (!skipCache && (!fetchOptions.method || fetchOptions.method === "GET")) {
      const cacheKey = generateCacheKey(url);
      const cached = apiCache.get<T>(cacheKey);
      if (cached !== null) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[Cache HIT] ${url}`);
        }
        return cached;
      }
    }

    const response = await withTimeout(fetch(url, fetchOptions));
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    const data = await response.json();

    // Cache the result for GET requests
    if (!skipCache && (!fetchOptions.method || fetchOptions.method === "GET")) {
      const cacheKey = generateCacheKey(url);
      apiCache.set(cacheKey, data, { ttl });
      if (process.env.NODE_ENV === "development") {
        console.log(`[Cache SET] ${url} (TTL: ${ttl ? Math.round(ttl / 1000) : 300}s)`);
      }
    }

    return data;
  } catch (err) {
    console.error(`Fetch error from ${url}:`, err);
    return null;
  }
}

// ---------------- Products ----------------
export async function fetchProducts(): Promise<Product[]> {
  try {
    const data = await safeFetch<Product[] | { products: Product[] }>(
      `${BASE_URL}/api/products`,
      {},
    );
    if (!data) return [];
    return Array.isArray(data) ? data : data.products || [];
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return [];
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const response = await withTimeout(
      fetch(`${BASE_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() } as HeadersInit,
      }),
    );
    if (!response.ok) throw new Error("Failed to delete product");
    
    // Invalidate product-related caches
    invalidateCachePattern("products");
    
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// ---------------- Orders ----------------
export async function fetchOrders(): Promise<Order[]> {
  try {
    const data = await safeFetch<Order[] | { orders: Order[] }>(
      `${BASE_URL}/api/orders`,
      {},
    );
    if (!data) return [];
    return Array.isArray(data) ? data : data.orders || [];
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return [];
  }
}

// ---------------- Users ----------------
export async function fetchUsers(): Promise<User[]> {
  try {
    const data = await safeFetch<User[] | { users: User[] }>(
      `${BASE_URL}/api/users`,
      {},
    );
    if (!data) return [];
    return Array.isArray(data) ? data : data.users || [];
  } catch (err) {
    console.error("Failed to fetch users:", err);
    return [];
  }
}

// ---------------- Vendors ----------------
export async function fetchVendors(): Promise<Vendor[]> {
  try {
    const data = await safeFetch<Vendor[] | { vendors: Vendor[] }>(
      `${BASE_URL}/api/vendors`,
      {},
    );
    if (!data) return [];
    return Array.isArray(data) ? data : data.vendors || [];
  } catch (err) {
    console.error("Failed to fetch vendors:", err);
    return [];
  }
}

export async function addVendor(
  vendor: Omit<Vendor, "id">,
): Promise<Vendor | null> {
  try {
    const result = await safeFetch<Vendor>(`${BASE_URL}/api/vendors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      } as HeadersInit,
      body: JSON.stringify(vendor),
      skipCache: true, // Don't cache POST results
    });
    
    // Invalidate vendor cache
    if (result) {
      invalidateCachePattern("vendors");
    }
    
    return result;
  } catch (err) {
    console.error("Failed to add vendor:", err);
    return null;
  }
}

export async function updateVendor(
  id: string,
  vendor: Partial<Vendor>,
): Promise<Vendor | null> {
  try {
    const authHeaders = getAuthHeaders();
    const result = await safeFetch<Vendor>(`${BASE_URL}/api/vendors/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      } as HeadersInit,
      body: JSON.stringify(vendor),
      skipCache: true, // Don't cache PUT results
    });
    
    // Invalidate vendor cache
    if (result) {
      invalidateCachePattern("vendors");
    }
    
    return result;
  } catch (err) {
    console.error("Failed to update vendor:", err);
    return null;
  }
}

export async function deleteVendor(id: string): Promise<boolean> {
  try {
    const response = await withTimeout(
      fetch(`${BASE_URL}/api/vendors/${id}`, {
        method: "DELETE",
        headers: { ...getAuthHeaders() } as HeadersInit,
      }),
    );
    if (!response.ok) throw new Error("Failed to delete vendor");
    
    // Invalidate vendor cache
    invalidateCachePattern("vendors");
    
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
