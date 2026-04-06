/**
 * Frontend application constants and configuration
 */

export const API_CONFIG = {
  DEFAULT_FETCH_TIMEOUT: 15000, // 15 seconds in milliseconds
  CART_FETCH_TIMEOUT: 10000, // 10 seconds for cart operations
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second between retries
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
};

export const CACHE = {
  PRODUCTS_CACHE_TIME: 60000, // 1 minute
  CATEGORIES_CACHE_TIME: 300000, // 5 minutes
};
