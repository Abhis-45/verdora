/**
 * useApiCache Hook
 * Simplifies using cached API calls in React components
 * Automatically handles caching for GET requests with 5-minute default TTL
 */

import { useState, useCallback, useEffect } from "react";
import { getFromBackend } from "@/lib/fetchWrapper";
import { apiCache, type CacheOptions } from "@/lib/apiCache";

interface UseApiCacheOptions extends CacheOptions {
  enabled?: boolean; // Whether to fetch on mount (default: true)
  refetchInterval?: number; // Auto-refetch interval in ms (default: disabled)
}

interface UseApiCacheResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isCached: boolean;
}

/**
 * Hook for fetching data with automatic caching
 * 
 * @example
 * const { data, loading, error } = useApiCache<Product[]>('/api/products');
 * 
 * @example
 * // Custom TTL
 * const { data, loading } = useApiCache<Product[]>('/api/products', {
 *   ttl: 10 * 60 * 1000 // 10 minutes
 * });
 * 
 * @example
 * // Skip cache on first load
 * const { data, loading } = useApiCache<Product[]>('/api/products', {
 *   skipCache: true
 * });
 */
export function useApiCache<T>(
  endpoint: string,
  options: UseApiCacheOptions = {},
): UseApiCacheResult<T> {
  const {
    enabled = true,
    refetchInterval,
    skipCache = false,
    ttl,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Check if data is already cached
      if (!skipCache) {
        const cached = apiCache.get<T>(endpoint);
        if (cached !== null) {
          setData(cached);
          setIsCached(true);
          setLoading(false);
          return;
        }
      }

      // Fetch from backend with caching
      const result = await getFromBackend<T>(endpoint, { skipCache, ttl });

      if (result !== null) {
        setData(result);
        setIsCached(false);
      } else {
        setError(new Error("Failed to fetch data"));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred"),
      );
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled, skipCache, ttl]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refetch interval
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isCached,
  };
}

/**
 * Hook to invalidate cache for a specific pattern
 * Useful after mutations like create, update, delete
 * 
 * @example
 * const { invalidate } = useCacheInvalidation();
 * 
 * const handleDelete = async (id: string) => {
 *   await deleteProduct(id);
 *   invalidate('products'); // Clear all product-related caches
 * };
 */
export function useCacheInvalidation() {
  return {
    invalidate: (pattern: string) => {
      const keys = apiCache.getKeys();
      const regex = new RegExp(pattern, "i");

      let cleared = 0;
      for (const key of keys) {
        if (regex.test(key)) {
          apiCache.clear(key);
          cleared++;
        }
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Cache Invalidation] Cleared ${cleared} cache entries matching: ${pattern}`,
        );
      }

      return cleared;
    },
    invalidateAll: () => {
      const size = apiCache.getSize();
      apiCache.clearAll();
      return size;
    },
  };
}

/**
 * Hook to manually manage cache
 * For advanced use cases where you need direct control
 * 
 * @example
 * const { get, set, clear } = useCacheControl();
 * 
 * // Get cached data
 * const data = get<Product>('/api/products');
 * 
 * // Set cache manually
 * set('/api/products', products, { ttl: 10 * 60 * 1000 });
 * 
 * // Clear specific cache
 * clear('/api/products');
 */
export function useCacheControl() {
  return {
    get: <T,>(key: string): T | null => apiCache.get<T>(key),
    set: <T,>(key: string, data: T, options?: CacheOptions) =>
      apiCache.set(key, data, options),
    clear: (key: string) => apiCache.clear(key),
    clearAll: () => apiCache.clearAll(),
    has: (key: string) => apiCache.has(key),
    getSize: () => apiCache.getSize(),
    getKeys: () => apiCache.getKeys(),
  };
}
