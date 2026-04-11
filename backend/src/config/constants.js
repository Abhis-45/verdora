/**
 * Application-wide constants
 */

export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "cancelled",
  "shipped",
  "delivered",
  "returned",
  "replaced",
  "refunded",
];

export const VENDOR_MANAGEABLE_STATUSES = ["accepted", "shipped", "delivered"];

// Customer can cancel orders before they are shipped
export const CUSTOMER_CANCELLABLE_STATUSES = ["pending", "accepted"];

// After shipped, customers can only request return or refund
export const CUSTOMER_RETURNABLE_STATUSES = ["delivered"];

export const ADMIN_ROLES = {
  ADMIN: "admin",
  VENDOR: "vendor",
};

export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const DEFAULT_PAGINATION_LIMIT = 10;
