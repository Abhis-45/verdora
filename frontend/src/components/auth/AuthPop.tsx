/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";
import { ensurePlus91 } from "@/utils/phone";
import Spinner from "../shared/Spinner";

type AuthPopupProps = {
  onClose: () => void;
  onLogin?: (user: any) => void; // optional callback after login
  initialMessage?: string;
  initialType?: "success" | "error" | "info";
};

// ✅ Validation functions
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhone = (phone: string): boolean => {
  return /^(\+?\d{1,3}[-.\s]?)?\d{10}$/.test(phone.replace(/[-.\s]/g, ""));
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const validateOtp = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

const validateIdentifier = (identifier: string): boolean => {
  if (identifier.includes("@")) {
    return validateEmail(identifier);
  }
  return validatePhone(identifier);
};

export default function AuthPopup({
  onClose,
  onLogin,
  initialMessage,
  initialType,
}: AuthPopupProps) {
  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [countdown, setCountdown] = useState(0);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [smsProvider, setSmsProvider] = useState<string | null>(null);
  const { login } = useUser();
  const [loading, setLoading] = useState(false);

  // ✅ Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // if an initial message is provided (e.g., opened because user is not authenticated), show it
  useEffect(() => {
    if (initialMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessage(initialMessage);
      if (initialType)
        setMessageType(initialType === "success" ? "success" : "error");
      else setMessageType("error");
    }
  }, [initialMessage, initialType]);

  // ✅ Send OTP
  const sendOtp = async () => {
    // Validate identifier
    if (!identifier.trim()) {
      setMessage("Please enter email or phone number");
      setMessageType("error");
      return;
    }

    if (!validateIdentifier(identifier)) {
      setMessage("Please enter a valid email or 10-digit phone number");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payloadIdentifier = identifier.includes("@")
        ? identifier.trim()
        : ensurePlus91(identifier.trim());
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: payloadIdentifier }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setOtpSent(true);
        setMessage(data.message || "OTP sent successfully");
        setMessageType("success");
        setCountdown(30); // start 30s timer
        
        // Capture verificationId and provider for SMS flows
        if (data.verificationId) {
          setVerificationId(data.verificationId);
        }
        if (data.provider) {
          setSmsProvider(data.provider);
        }
      } else {
        setMessage(data.message || "Failed to send OTP");
        setMessageType("error");
      }
    } catch (err) {
      setLoading(false);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  // ✅ Verify OTP
  const verifyOtp = async () => {
    // Validate OTP format
    if (!otp.trim()) {
      setMessage("Please enter OTP");
      setMessageType("error");
      return;
    }

    if (!validateOtp(otp)) {
      setMessage("OTP must be 6 digits");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payloadIdentifier = identifier.includes("@")
        ? identifier.trim()
        : ensurePlus91(identifier.trim());
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      console.log(`🔐 [Frontend] Verifying OTP for: ${payloadIdentifier}`);
      console.log(`🔐 [Frontend] OTP entered: ${otp}`);
      console.log(`🔐 [Frontend] SMS Provider: ${smsProvider}, VerificationId: ${verificationId}`);

      // Build request body based on provider
      const requestBody: any = {
        identifier: payloadIdentifier,
      };

      // If MessageCentrals SMS provider, use verificationId + code
      if (smsProvider === "messagecentrals" && verificationId) {
        requestBody.verificationId = verificationId;
        requestBody.code = otp.trim();
      } else {
        // Otherwise use standard otp field
        requestBody.otp = otp.trim();
      }

      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      setLoading(false);

      console.log(`🔐 [Frontend] Verify OTP response status: ${res.status}`);
      console.log(`🔐 [Frontend] Response data:`, data);

      if (res.ok) {
        console.log(`✅ [Frontend] OTP verification successful, logging in user`);
        login(data.user, data.token);
        setMessage("Login successful!");
        setMessageType("success");
        if (onLogin) {
          onLogin(data.user);
        } else {
          setTimeout(() => onClose(), 500);
        }
      } else {
        console.log(`❌ [Frontend] OTP verification failed: ${data.message}`);
        setMessage(data.message || "Invalid OTP");
        setMessageType("error");
        // Clear OTP on failure to prevent reuse
        setOtp("");
      }
    } catch (err) {
      setLoading(false);
      console.error(`❌ [Frontend] OTP verification error:`, err);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  // ✅ Password Login/Register combined
  const loginOrRegisterPassword = async () => {
    // Validate identifier
    if (!identifier.trim()) {
      setMessage("Please enter email or phone number");
      setMessageType("error");
      return;
    }

    if (!validateIdentifier(identifier)) {
      setMessage("Please enter a valid email or 10-digit phone number");
      setMessageType("error");
      return;
    }

    // Validate password
    if (!password.trim()) {
      setMessage("Please enter password");
      setMessageType("error");
      return;
    }

    if (!validatePassword(password)) {
      setMessage("Password must be at least 6 characters");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const mobilePayload = !identifier.includes("@")
        ? ensurePlus91(identifier.trim())
        : null;
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";
      const res = await fetch(`${BACKEND_URL}/api/auth/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.includes("@") ? identifier.trim() : null,
          mobile: mobilePayload,
          password: password.trim(),
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        login(data.user, data.token);
        setMessage("Login successful!");
        setMessageType("success");
        if (onLogin) {
          onLogin(data.user);
        } else {
          setTimeout(() => onClose(), 500);
        }
      } else {
        setMessage(data.message || "Login failed");
        setMessageType("error");
      }
    } catch (err) {
      setLoading(false);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 z-50 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-green-900 p-6 sm:p-8 rounded-lg shadow-lg w-full sm:w-96 max-h-96 overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-xl sm:text-2xl"
        >
          ✕
        </button>

        <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">
          Login / Register
        </h2>

        {/* Identifier input */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Enter Email or Mobile"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                e.preventDefault();
                if (mode === "password") {
                  loginOrRegisterPassword();
                } else if (!otpSent) {
                  sendOtp();
                }
              }
            }}
            className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          {identifier && !validateIdentifier(identifier) && (
            <p className="text-xs sm:text-sm text-red-400 mt-1">
              Enter valid email or 10-digit phone number
            </p>
          )}
        </div>

        {/* OTP Mode */}
        {mode === "otp" && (
          <>
            {!otpSent ? (
              <button
                onClick={sendOtp}
                disabled={
                  !identifier || !validateIdentifier(identifier) || loading
                }
                className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : "Send OTP"}
              </button>
            ) : (
              <>
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading) {
                        e.preventDefault();
                        verifyOtp();
                      }
                    }}
                    className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded mt-2 text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                  {otp && !validateOtp(otp) && (
                    <p className="text-xs sm:text-sm text-red-400 mt-1">
                      OTP must be 6 digits
                    </p>
                  )}
                </div>

                <button
                  onClick={verifyOtp}
                  disabled={!otp || !validateOtp(otp) || loading}
                  className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded mt-2 hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {loading ? <Spinner /> : "Verify OTP"}
                </button>

                {/* Resend OTP with countdown */}
                <p className="mt-2 text-center text-sm sm:text-base">
                  {countdown > 0 ? (
                    <span className="text-gray-300">
                      Resend OTP in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={sendOtp}
                      className="underline cursor-pointer text-green-400 hover:text-green-300"
                    >
                      {loading ? <Spinner /> : "Resend OTP"}
                    </button>
                  )}
                </p>
              </>
            )}
          </>
        )}

        {/* Password Mode */}
        {mode === "password" && (
          <>
            <div className="mb-3">
              <input
                type="password"
                placeholder="Enter Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    e.preventDefault();
                    loginOrRegisterPassword();
                  }
                }}
                className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded text-white bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              {password && !validatePassword(password) && (
                <p className="text-xs sm:text-sm text-red-400 mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <button
              onClick={loginOrRegisterPassword}
              disabled={
                !identifier ||
                !validateIdentifier(identifier) ||
                !password ||
                !validatePassword(password) ||
                loading
              }
              className="w-full py-2 sm:py-3 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner /> : "Login"}
            </button>
          </>
        )}

        {/* Toggle link */}
        <p className="mb-4 text-xs sm:text-sm text-center mt-4">
          {mode === "otp" ? (
            <span className="text-gray-300">
              with password?{" "}
              <a
                onClick={() => {
                  setMode("password");
                  setMessage("");
                  setOtp("");
                  setOtpSent(false);
                }}
                className="underline cursor-pointer text-green-400 hover:text-green-300"
              >
                Use Password
              </a>
            </span>
          ) : (
            <span className="text-gray-300">
              with OTP?{" "}
              <a
                onClick={() => {
                  setMode("otp");
                  setMessage("");
                  setPassword("");
                }}
                className="underline cursor-pointer text-green-400 hover:text-green-300"
              >
                Use OTP
              </a>
            </span>
          )}
        </p>

        {/* Message Display */}
        {message && (
          <p
            className={`mt-2 text-center text-xs sm:text-sm p-2 rounded ${
              messageType === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
