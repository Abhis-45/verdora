/**
 * Pincode API Backend Route
 * Provides cached access to postal pincode information
 */
import express from "express";
import { CACHE_DURATION } from "../config/constants.js";

const router = express.Router();

// Simple in-memory cache for pincode data (in production, use Redis)
const pincodeCache = new Map();

/**
 * API response type from postalpincode.in
 */
async function fetchFromPostalPincodeAPI(pincode) {
  try {
    const url = `https://api.postalpincode.in/pincode/${pincode}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Handle array-wrapped response
    let responseData = data;
    if (Array.isArray(data) && data.length > 0) {
      responseData = data[0];
    }

    // API returns Status "Success" for valid pincodes
    if (
      !responseData ||
      responseData.Status !== "Success" ||
      !responseData.PostOffice ||
      responseData.PostOffice.length === 0
    ) {
      return null;
    }

    const firstOffice = responseData.PostOffice[0];
    const result = {
      pincode,
      city: firstOffice.District || "Unknown",
      state: firstOffice.State || "Unknown",
      area: firstOffice.Name || null,
      country: "India",
    };

    return result;
  } catch (error) {
    return null;
  }
}

/**
 * Get pincode from coordinates (latitude/longitude) - MUST be BEFORE /:pincode route
 * GET /api/pincode/from-coordinates?lat=<latitude>&lon=<longitude>
 * Returns city and state info; pincode approximation is limited without a proper database
 */
router.get("/from-coordinates", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Missing coordinates",
        message: "Please provide lat and lon query parameters",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: "Invalid coordinates",
        message: "Coordinates must be valid numbers",
      });
    }

    // Use reverse geocoding to get city/state from coordinates
    // Then try to find a common pincode for that area
    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      );

      if (nominatimResponse.ok) {
        const geoData = await nominatimResponse.json();
        const address = geoData.address || {};

        const city =
          address.city || address.town || address.county || "Unknown";
        const state = address.state || "Unknown";

        // Try to find a pincode for this city
        // This is a limitation - the postal API only accepts pincode, not city
        // In production, you'd want a proper pincode database indexed by city
        // For now, we return the location info and recommend user enter pincode
        return res.json({
          data: {
            city,
            state,
            country: address.country || "India",
            area: address.village || address.suburb,
            // Note: Pincode requires user input since API doesn't support city-based search
            pincode: null,
            note: "Please enter your 6-digit pincode for exact location",
          },
          fromApi: true,
        });
      }
    } catch (geoError) {}

    res.json({
      data: {
        city: "Unknown",
        state: "Unknown",
        country: "India",
        pincode: null,
        note: "Could not determine location. Please enter your pincode manually.",
      },
      fromApi: false,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to process coordinates",
    });
  }
});

/**
 * GET /api/pincode/:pincode
 * Get location details for a pincode
 */
router.get("/:pincode", async (req, res) => {
  try {
    const { pincode } = req.params;

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        error: "Invalid pincode format",
        message: "Pincode must be 6 digits",
      });
    }

    // Check cache
    const cached = pincodeCache.get(pincode);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({
        data: cached.data,
        fromCache: true,
      });
    }

    // Fetch from API
    const data = await fetchFromPostalPincodeAPI(pincode);

    if (!data) {
      return res.status(404).json({
        error: "Pincode not found",
        message: "No location data found for this pincode",
      });
    }

    // Cache the result
    pincodeCache.set(pincode, {
      data,
      timestamp: Date.now(),
    });

    res.json({
      data,
      fromCache: false,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch pincode data",
    });
  }
});

/**
 * Validate a pincode (just check format + existence)
 * GET /api/pincode/:pincode/validate
 */
router.get("/:pincode/validate", async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!/^\d{6}$/.test(pincode)) {
      return res.json({ valid: false, message: "Invalid format" });
    }

    const cached = pincodeCache.get(pincode);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.json({
        valid: !!cached.data,
        data: cached.data,
      });
    }

    const data = await fetchFromPostalPincodeAPI(pincode);

    if (data) {
      pincodeCache.set(pincode, {
        data,
        timestamp: Date.now(),
      });
    }

    res.json({
      valid: !!data,
      data: data || null,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

export default router;
