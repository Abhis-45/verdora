/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Pincode API utilities using https://api.postalpincode.in/
 * Fetches location data (city, state, area) from pincode
 */

export type PincodeData = {
  pincode: string;
  city: string;
  state: string;
  area?: string;
  country: string;
  message?: string;
};

export type ApiPostalResponse = {
  Status: string;
  Message?: string;
  PostOffice?: Array<{
    Name: string;
    District: string;
    State: string;
    Pincode: string;
  }>;
};

const getBackendUrl = () =>
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

/**
 * Fetch location details from pincode using Postal Pincode API
 * Also attempts to use backend endpoint for caching
 */
const fetchFromBackendPincodeEndpoint = async (
  pincode: string,
): Promise<PincodeData | null> => {
  try {
    const response = await fetch(`${getBackendUrl()}/api/pincode/${pincode}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.warn("Backend pincode endpoint failed:", error);
    return null;
  }
};

export const fetchLocationFromPincode = async (
  pincode: string,
): Promise<PincodeData | null> => {
  try {
    const normalized = pincode.replace(/\D/g, "").slice(0, 6);

    if (!/^\d{6}$/.test(normalized)) {
      return null;
    }

    const backendResult = await fetchFromBackendPincodeEndpoint(normalized);
    if (backendResult) {
      return backendResult;
    }

    const response = await fetch(
      `https://api.postalpincode.in/pincode/${normalized}`,
    );

    if (!response.ok) {
      return null;
    }

    let data: any = await response.json();

    // Handle array-wrapped response from API
    if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }

    // API returns Status 0 for invalid pincode, 404 for not found
    if (
      !data ||
      data.Status !== "Success" ||
      !data.PostOffice ||
      data.PostOffice.length === 0
    ) {
      return null;
    }

    const firstPostOffice = data.PostOffice[0];

    const result = {
      pincode: normalized,
      city: firstPostOffice.District || "Unknown",
      state: firstPostOffice.State || "Unknown",
      area: firstPostOffice.Name || undefined,
      country: "India",
      message: data.Message,
    };

    return result;
  } catch (error) {
    console.error("Error fetching pincode data:", error);
    return null;
  }
};

/**
 * Validate if a pincode is valid format
 */
export const isValidPincode = (pincode: string): boolean => {
  const normalized = pincode.replace(/\D/g, "").slice(0, 6);
  return /^\d{6}$/.test(normalized);
};

/**
 * Normalize pincode - remove non-digits and limit to 6 chars
 */
export const normalizePincode = (pincode: string): string => {
  return pincode.replace(/\D/g, "").slice(0, 6);
};
