// API Helper - Centralized API calls for vendor dashboard
// Reduces code duplication and improves maintainability

const BACKEND_URL = 
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
    : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

export const apiHelper = {
  // Fetch helper with timeout
  async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 20000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  },

  // Get vendor profile
  async getVendorProfile(token: string) {
    const response = await this.fetchWithTimeout(
      `${BACKEND_URL}/api/vendor/profile`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error("Failed to fetch profile");
    return response.json();
  },

  // Get vendor products
  async getVendorProducts(token: string, search = "", timeout = 20000) {
    const response = await this.fetchWithTimeout(
      `${BACKEND_URL}/api/vendor/products?search=${search}`,
      { headers: { Authorization: `Bearer ${token}` } },
      timeout
    );
    if (!response.ok) throw new Error("Failed to fetch products");
    const data = await response.json();
    return Array.isArray(data.products) ? data.products : [];
  },

  // Get vendor stats
  async getVendorStats(token: string) {
    const response = await this.fetchWithTimeout(
      `${BACKEND_URL}/api/vendor/stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
  },

  // Get vendor orders
  async getVendorOrders(token: string, timeout = 30000) {
    const response = await this.fetchWithTimeout(
      `${BACKEND_URL}/api/vendor/orders`,
      { headers: { Authorization: `Bearer ${token}` } },
      timeout
    );
    if (!response.ok) throw new Error("Failed to fetch orders");
    const data = await response.json();
    return Array.isArray(data.orders) ? data.orders : [];
  },

  // Update vendor profile
  async updateVendorProfile(token: string, data: Record<string, unknown>) {
    const response = await fetch(`${BACKEND_URL}/api/vendor/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update profile");
    return response.json();
  },

  // Delete product
  async deleteProduct(token: string, productId: string) {
    const response = await fetch(
      `${BACKEND_URL}/api/vendor/products/${productId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to delete product");
    return response.json();
  },

  // Update order item status
  async updateOrderItemStatus(
    token: string,
    orderId: string,
    itemId: string,
    status: string,
    trackingId: string = ""
  ) {
    const response = await fetch(
      `${BACKEND_URL}/api/vendor/orders/${orderId}/items/${itemId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, trackingId }),
      }
    );
    if (!response.ok) throw new Error("Failed to update order status");
    return response.json();
  },
};
