/**
 * API Cache Utility
 * Caches API responses in memory to reduce redundant API calls
 * Default TTL: 5 minutes, Configurable up to 10 minutes
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes = 300000ms)
  skipCache?: boolean; // Whether to skip cache for this request
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private maxTTL: number = 10 * 60 * 1000; // 10 minutes maximum
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Set custom default TTL (in milliseconds)
   */
  setDefaultTTL(ttl: number): void {
    if (ttl > this.maxTTL) {
      console.warn(`TTL exceeds max (${this.maxTTL}ms). Setting to max.`);
      this.defaultTTL = this.maxTTL;
    } else {
      this.defaultTTL = ttl;
    }
  }

  /**
   * Get cached data if valid, otherwise return null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if cache has expired
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Log cache hit for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Cache HIT] ${key} (age: ${Math.round(age / 1000)}s)`,
      );
    }

    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    let ttl = options.ttl || this.defaultTTL;

    // Enforce max TTL
    if (ttl > this.maxTTL) {
      ttl = this.maxTTL;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Cache SET] ${key} (TTL: ${Math.round(ttl / 1000)}s)`,
      );
    }
  }

  /**
   * Check if cache exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Cache CLEAR] ${key}`);
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    if (process.env.NODE_ENV === "development") {
      console.log("[Cache CLEAR ALL]");
    }
  }

  /**
   * Get cache size (for debugging)
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Start automatic cleanup of expired entries
   * Runs every 1 minute
   */
  private startCleanupTimer(): void {
    if (typeof window === "undefined") {
      // Don't set cleanup timer on server side
      return;
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let removed = 0;

      for (const [key, entry] of this.cache.entries()) {
        const age = now - entry.timestamp;
        if (age > entry.ttl) {
          this.cache.delete(key);
          removed++;
        }
      }

      if (removed > 0 && process.env.NODE_ENV === "development") {
        console.log(`[Cache Cleanup] Removed ${removed} expired entries`);
      }
    }, 60000); // Run every minute
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const apiCache = new APICache();

/**
 * Generate cache key from URL and options
 */
export function generateCacheKey(url: string, options?: RequestInit): string {
  // For GET requests with no body, just use URL
  if (!options || !options.body) {
    return `GET:${url}`;
  }

  // For POST/PUT/DELETE, include method and body hash
  const method = options.method || "GET";
  const bodyHash = options.body
    ? Math.abs(
        Array.from(String(options.body)).reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0),
      )
    : "no-body";

  return `${method}:${url}:${bodyHash}`;
}

/**
 * Helper function to get data from cache or fetch
 * Automatically handles caching logic
 */
export async function getFromCacheOrFetch<T>(
  url: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {},
): Promise<T> {
  const { skipCache = false } = options;

  const cacheKey = generateCacheKey(url);

  // Try to get from cache first (unless skipped)
  if (!skipCache) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch data
  const data = await fetchFn();

  // Cache the result
  apiCache.set(cacheKey, data, options);

  return data;
}

/**
 * Clear cache for specific patterns
 * Useful for invalidating related caches after mutations
 */
export function invalidateCachePattern(pattern: string): void {
  const keys = apiCache.getKeys();
  const regex = new RegExp(pattern);

  let cleared = 0;
  for (const key of keys) {
    if (regex.test(key)) {
      apiCache.clear(key);
      cleared++;
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Cache Invalidate] Cleared ${cleared} entries matching: ${pattern}`);
  }
}

export type { CacheOptions, CacheEntry };
