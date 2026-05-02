/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import OtpInput from "./OtpInput";
import styles from "./OtpVerification.module.css";
import Spinner from "../shared/Spinner";

interface OtpVerificationProps {
  identifier: string; // phone or email
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  onError?: (message: string) => void;
}

/**
 * OTP Verification Modal Component
 * Displays OTP input and verification flow.
 */
export default function OtpVerification({
  identifier,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [smsProvider, setSmsProvider] = useState<string | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp("");
      setMessage("");
      setCountdown(30);
      setCanResend(false);
    }
  }, [isOpen]);

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage("");

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("OTP resent successfully");
        setMessageType("success");
        setCountdown(30);
        setCanResend(false);
        setOtp("");
        
        // Capture Message Central verification id for SMS flows.
        if (data.verificationId || data.requestId) {
          setVerificationId(data.verificationId || data.requestId);
        }
        if (data.provider) {
          setSmsProvider(data.provider);
        }
      } else {
        setMessage(data.message || "Failed to resend OTP");
        setMessageType("error");
        if (onError) onError(data.message || "Failed to resend OTP");
      }
    } catch {
      setMessage("Network error. Please try again.");
      setMessageType("error");
      if (onError) onError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const BACKEND_URL =
        typeof window !== "undefined"
          ? process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com"
          : process.env.NEXT_PUBLIC_BACKEND_URL || "https://verdora.onrender.com";

      console.log(`🔐 [OtpVerification] Verifying OTP for: ${identifier}`);
      console.log(`🔐 [OtpVerification] OTP entered: ${otp}`);
      console.log(`🔐 [OtpVerification] SMS Provider: ${smsProvider}, VerificationId: ${verificationId}`);

      // Build request body based on provider
      const requestBody: any = {
        identifier,
      };

      // If Message Central is used, the provider verifies the SMS OTP.
      if (
        (smsProvider === "messagecentral" || smsProvider === "messagecentrals") &&
        verificationId
      ) {
        requestBody.verificationId = verificationId;
        requestBody.code = otp;
      } else {
        // Otherwise use standard otp field
        requestBody.otp = otp;
      }

      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      console.log(`🔐 [OtpVerification] Response status: ${res.status}`);
      console.log(`🔐 [OtpVerification] Response data:`, data);

      if (res.ok) {
        console.log(`✅ [OtpVerification] OTP verification successful`);
        setMessage("OTP verified successfully!");
        setMessageType("success");
        setTimeout(() => {
          onSuccess(data);
          onClose();
        }, 500);
      } else {
        console.log(`❌ [OtpVerification] OTP verification failed: ${data.message}`);
        setMessage(data.message || "Invalid OTP");
        setMessageType("error");
        // Clear OTP on failure to prevent reuse attempts
        setOtp("");
        if (onError) onError(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(`❌ [OtpVerification] Network error:`, err);
      setMessage("Network error. Please try again.");
      setMessageType("error");
      if (onError) onError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isPhoneNumber = !identifier.includes("@");
  const maskedIdentifier = isPhoneNumber
    ? identifier.replace(/(\d)(?=(\d{2})\D*$)/g, "*")
    : identifier.replace(/^(.{2})[^@]*(@.*)$/, "$1***$2");

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading && otp.length === 6) {
            e.preventDefault();
            handleVerifyOtp();
          }
        }}
        tabIndex={-1}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2>Verify OTP</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <p className={styles.description}>
            Enter the 6-digit OTP sent to <strong>{maskedIdentifier}</strong>
          </p>

          {/* OTP Input */}
          <OtpInput
            length={6}
            value={otp}
            onChange={setOtp}
            disabled={loading}
          />

          {/* Message */}
          {message && (
            <div
              className={`${styles.message} ${styles[messageType]}`}
            >
              {messageType === "success" ? "✓ " : "✕ "}
              {message}
            </div>
          )}

          {/* Resend OTP */}
          <div className={styles.resendContainer}>
            {!canResend ? (
              <p className={styles.countdown}>
                Resend OTP in <strong>{countdown}s</strong>
              </p>
            ) : (
              <button
                className={styles.resendBtn}
                onClick={handleResendOtp}
                disabled={loading}
              >
                Didn&apos;t receive OTP? Resend
              </button>
            )}
          </div>

          {/* Help Text */}
          <p className={styles.helpText}>
            OTP valid for 10 minutes. Check your spam folder if you didn&apos;t receive it.
          </p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.verifyBtn}
            onClick={handleVerifyOtp}
            disabled={loading || otp.length !== 6}
          >
            {loading ? <Spinner /> : "Verify OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
