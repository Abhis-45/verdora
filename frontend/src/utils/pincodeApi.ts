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

/**
 * Fetch location details from pincode using Postal Pincode API
 * Also attempts to use backend endpoint for caching
 */
const fetchFromBackendPincodeEndpoint = async (
  pincode: string,
): Promise<PincodeData | null> => {
  try {
    const response = await fetch(`/api/pincode/${pincode}`, {
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
      console.warn("Invalid pincode format:", normalized);
      return null;
    }

    console.log("fetchLocationFromPincode: Trying backend for:", normalized);
    // Try backend endpoint first (has caching)
    const backendResult = await fetchFromBackendPincodeEndpoint(normalized);
    if (backendResult) {
      console.log(
        "fetchLocationFromPincode: Got result from backend:",
        backendResult,
      );
      return backendResult;
    }

    console.log(
      "fetchLocationFromPincode: Backend failed, trying direct API for:",
      normalized,
    );
    // Fall back to direct API call
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${normalized}`,
    );

    if (!response.ok) {
      console.warn(
        "fetchLocationFromPincode: Direct API returned non-ok status:",
        response.status,
      );
      return null;
    }

    let data: any = await response.json();
    console.log("fetchLocationFromPincode: Direct API raw response:", data);

    // Handle array-wrapped response from API
    if (Array.isArray(data) && data.length > 0) {
      data = data[0];
      console.log("fetchLocationFromPincode: Unwrapped array response:", data);
    }

    // API returns Status 0 for invalid pincode, 404 for not found
    if (
      !data ||
      data.Status !== "Success" ||
      !data.PostOffice ||
      data.PostOffice.length === 0
    ) {
      console.warn("fetchLocationFromPincode: Invalid response data:", data);
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

    console.log("fetchLocationFromPincode: Returning result:", result);
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
