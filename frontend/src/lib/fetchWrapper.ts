/**
 * Global Fetch Wrapper
 * Automatically prepends backend URL to /api/* requests
 * Ensures all API calls go to Render backend, not Vercel
 */

const BACKEND_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
    : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

/**
 * Wrapped fetch that automatically handles /api/* URLs
 * Routes them to the backend instead of Vercel
 */
export async function fetchWithBackend(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  // If URL starts with /api/, prepend backend URL
  const fullUrl = url.startsWith("/api/")
    ? `${BACKEND_URL}${url}`
    : url;

  console.log(`[API Call] ${fullUrl} (from: ${url})`);

  return fetch(fullUrl, options);
}

/**
 * Shorthand for common patterns
 */
export async function getFromBackend<T>(
  endpoint: string,
): Promise<T | null> {
  try {
    const url = endpoint.startsWith("/api/")
      ? `${BACKEND_URL}${endpoint}`
      : endpoint;
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch from ${endpoint}:`, error);
    return null;
  }
}

export async function postToBackend<T>(
  endpoint: string,
  data?: any,
  headers?: Record<string, string>,
): Promise<T | null> {
  try {
    const url = endpoint.startsWith("/api/")
      ? `${BACKEND_URL}${endpoint}`
      : endpoint;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to post to ${endpoint}:`, error);
    return null;
  }
}
