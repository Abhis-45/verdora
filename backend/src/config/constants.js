/**
 * Application-wide constants
 */

export const ORDER_STATUSES = [
  "accepted",
  "shipped",
  "delivered",
  "returned",
  "replaced",
  "refunded",
];

export const VENDOR_MANAGEABLE_STATUSES = ["accepted", "shipped", "delivered"];

export const ADMIN_ROLES = {
  ADMIN: "admin",
  VENDOR: "vendor",
};

export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const DEFAULT_PAGINATION_LIMIT = 10;
