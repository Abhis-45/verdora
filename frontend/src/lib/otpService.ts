/**
 * 2Factor.in SMS OTP Integration API Service
 * Handles OTP sending and verification through 2Factor API
 */

interface SendOtpResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface VerifyOtpResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
  error?: string;
}

/**
 * Send OTP to phone number or email
 * @param identifier - Phone number or email
 * @returns Promise with send status
 */
export const sendOtp = async (
  identifier: string
): Promise<SendOtpResponse> => {
  try {
    const BACKEND_URL =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
        : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

    const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        message: data.message || "OTP sent successfully",
      };
    }

    return {
      success: false,
      error: data.message || "Failed to send OTP",
    };
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return {
      success: false,
      error: error.message || "Network error while sending OTP",
    };
  }
};

/**
 * Verify OTP
 * @param identifier - Phone number or email
 * @param otp - 6-digit OTP
 * @returns Promise with verification status and user data
 */
export const verifyOtp = async (
  identifier: string,
  otp: string
): Promise<VerifyOtpResponse> => {
  try {
    const BACKEND_URL =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
        : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

    const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        otp,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        token: data.token,
        user: data.user,
        message: data.message || "OTP verified successfully",
      };
    }

    return {
      success: false,
      error: data.message || "Invalid OTP",
    };
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return {
      success: false,
      error: error.message || "Network error while verifying OTP",
    };
  }
};

/**
 * Complete OTP login flow
 * @param identifier - Phone number or email
 * @returns Promise with login status and user data
 */
export const otpLogin = async (identifier: string): Promise<VerifyOtpResponse> => {
  // First send OTP
  const sendResponse = await sendOtp(identifier);

  if (!sendResponse.success) {
    return {
      success: false,
      error: sendResponse.error,
    };
  }

  // Return success - frontend should prompt for OTP verification
  return {
    success: true,
    message: sendResponse.message,
  };
};

/**
 * Resend OTP
 * @param identifier - Phone number or email
 * @returns Promise with send status
 */
export const resendOtp = async (identifier: string): Promise<SendOtpResponse> => {
  return sendOtp(identifier);
};
