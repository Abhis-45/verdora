/**
 * Global Fetch Wrapper with Caching
 * Automatically prepends backend URL to /api/* requests
 * Ensures all API calls go to Render backend, not Vercel
 * Includes automatic caching for 5 minutes
 */

import { apiCache, generateCacheKey, type CacheOptions } from "./apiCache";

const BACKEND_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
    : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

/**
 * Wrapped fetch that automatically handles /api/* URLs
 * Routes them to the backend instead of Vercel
 * Includes caching for GET requests by default
 */
export async function fetchWithBackend(
  url: string,
  options?: RequestInit & CacheOptions,
): Promise<Response> {
  // If URL starts with /api/, prepend backend URL
  const fullUrl = url.startsWith("/api/")
    ? `${BACKEND_URL}${url}`
    : url;

  console.log(`[API Call] ${fullUrl} (from: ${url})`);

  return fetch(fullUrl, options);
}

/**
 * Shorthand for common patterns with automatic caching
 * GET requests are cached for 5 minutes by default
 * Set skipCache: true in options to bypass cache
 */
export async function getFromBackend<T>(
  endpoint: string,
  cacheOptions: CacheOptions = {},
): Promise<T | null> {
  const { skipCache = false, ttl } = cacheOptions;

  try {
    const url = endpoint.startsWith("/api/")
      ? `${BACKEND_URL}${endpoint}`
      : endpoint;

    const cacheKey = generateCacheKey(url);

    // Try to get from cache first (unless skipped)
    if (!skipCache) {
      const cached = apiCache.get<T>(cacheKey);
      if (cached !== null) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[Cache HIT] ${endpoint}`);
        }
        return cached;
      }
    }

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the result
    apiCache.set(cacheKey, data, { ttl });

    if (process.env.NODE_ENV === "development") {
      console.log(`[Cache SET] ${endpoint} (TTL: ${ttl ? Math.round(ttl / 1000) : 300}s)`);
    }

    return data;
  } catch (error) {
    console.error(`Failed to fetch from ${endpoint}:`, error);
    return null;
  }
}

export async function postToBackend<T>(
  endpoint: string,
  data?: unknown,
  headers?: Record<string, string>,
  cacheOptions?: CacheOptions,
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

    const result = await response.json();

    // Optionally cache POST results (useful for idempotent operations)
    if (cacheOptions && !cacheOptions.skipCache) {
      const cacheKey = generateCacheKey(url, { body: JSON.stringify(data) });
      apiCache.set(cacheKey, result, cacheOptions);
    }

    return result;
  } catch (error) {
    console.error(`Failed to post to ${endpoint}:`, error);
    return null;
  }
}
