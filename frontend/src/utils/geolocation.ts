/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Geolocation utilities for getting user's current location
 */

export type GeolocationCoordinates = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type ReverseGeocodeResult = {
  city?: string;
  state?: string;
  country?: string;
  area?: string;
  pincode?: string;
};

/**
 * Get user's current geolocation coordinates
 * Returns null if geolocation is not available or user denies permission
 */
export const getCurrentLocation =
  (): Promise<GeolocationCoordinates | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by this browser");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        },
      );
    });
  };

/**
 * Reverse geocode coordinates to get address information
 * Uses OpenStreetMap Nominatim API (free, no key needed)
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
    );

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json();
    const address = data.address || {};

    return {
      area: address.village || address.suburb || address.town || undefined,
      city: address.city || address.town || address.county || undefined,
      state: address.state || undefined,
      country: address.country || "India",
    };
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
};

/**
 * Get pincode from coordinates by calling backend endpoint
 * Backend will use reverse geocoding and attempt to find pincode
 */
export const getPincodeFromCoordinates = async (
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> => {
  try {
    // First, try the backend endpoint that can do advanced pincode lookup
    const response = await fetch(
      `/api/pincode/from-coordinates?lat=${latitude}&lon=${longitude}`,
    );

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.pincode) {
        return data.data;
      }
    }

    // Fallback to reverse geocoding to at least get city/state
    return reverseGeocode(latitude, longitude);
  } catch (error) {
    console.error("Error getting pincode from coordinates:", error);
    // Fallback to reverse geocoding
    return reverseGeocode(latitude, longitude);
  }
};

/**
 * Get current location with automatic reverse geocoding and pincode lookup
 */
export const getCurrentLocationWithAddress = async (): Promise<{
  coordinates: GeolocationCoordinates;
  address: ReverseGeocodeResult;
} | null> => {
  try {
    const coordinates = await getCurrentLocation();
    if (!coordinates) return null;

    const address = await getPincodeFromCoordinates(
      coordinates.latitude,
      coordinates.longitude,
    );
    if (!address) return null;

    return { coordinates, address };
  } catch (error) {
    console.error("Error getting current location with address:", error);
    return null;
  }
};
