/**
 * Delivery Data Manager
 * Handles persistence of delivery/location data in localStorage
 */

export interface DeliveryData {
  selectedAddressId?: string;
  lastDeliveryLocation?: {
    pincode: string;
    city: string;
    state: string;
    area?: string;
  };
  lastSearchedPincode?: string;
  timestamp: number;
}

const STORAGE_KEY = "verdora_delivery_data";

/**
 * Get delivery data from localStorage
 */
export function getDeliveryData(): DeliveryData | null {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    // Validate that data is not stale (older than 30 days)
    if (
      parsed.timestamp &&
      Date.now() - parsed.timestamp > 30 * 24 * 60 * 60 * 1000
    ) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("Error reading delivery data:", error);
    return null;
  }
}

/**
 * Save delivery data to localStorage
 */
export function saveDeliveryData(data: Partial<DeliveryData>): void {
  if (typeof window === "undefined") return;

  try {
    const current = getDeliveryData() || { timestamp: Date.now() };
    const updated = {
      ...current,
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving delivery data:", error);
  }
}

/**
 * Clear delivery data from localStorage
 */
export function clearDeliveryData(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing delivery data:", error);
  }
}

/**
 * Save selected address ID
 */
export function saveSelectedAddressId(addressId: string): void {
  saveDeliveryData({ selectedAddressId: addressId });
}

/**
 * Get last selected address ID
 */
export function getLastSelectedAddressId(): string | undefined {
  return getDeliveryData()?.selectedAddressId;
}

/**
 * Save delivery location (after pincode lookup)
 */
export function saveDeliveryLocation(location: {
  pincode: string;
  city: string;
  state: string;
  area?: string;
}): void {
  saveDeliveryData({
    lastDeliveryLocation: location,
    lastSearchedPincode: location.pincode,
  });
}

/**
 * Get last delivery location
 */
export function getLastDeliveryLocation() {
  return getDeliveryData()?.lastDeliveryLocation;
}
