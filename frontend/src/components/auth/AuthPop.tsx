"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import Spinner from "../shared/Spinner";

type AuthPopupProps = {
  onClose: () => void;
  onLogin?: (user: AuthUser) => void;
  initialMessage?: string;
  initialType?: "success" | "error" | "info";
};

type AuthUser = {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  orders?: unknown[];
  [key: string]: unknown;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend.verdora.in";

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

const isEmail = (identifier: string): boolean => {
  return validateEmail(identifier.trim());
};

const isPhone = (identifier: string): boolean => {
  return validatePhone(identifier.trim());
};

const isValidIdentifier = (identifier: string): boolean => {
  return isEmail(identifier) || isPhone(identifier);
};

export default function AuthPopup({
  onClose,
  onLogin,
  initialMessage,
  initialType,
}: AuthPopupProps) {
  const [mode, setMode] = useState<"otp" | "password">("otp");
  const [resetMode, setResetMode] = useState<
    "request" | "verify" | "reset" | null
  >(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerificationId, setOtpVerificationId] = useState("");
  const [message, setMessage] = useState(initialMessage || "");
  const [messageType, setMessageType] = useState<"success" | "error">(
    initialType === "success" ? "success" : "error",
  );
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const { login } = useUser();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const finishLogin = (user: AuthUser, token: string) => {
    login(user, token);
    setMessage("Login successful!");
    setMessageType("success");
    if (onLogin) {
      onLogin(user);
      return;
    }
    setTimeout(() => onClose(), 500);
  };

  const sendOtp = async () => {
    if (!identifier.trim()) {
      setMessage("Please enter email or mobile number");
      setMessageType("error");
      return;
    }

    if (!isValidIdentifier(identifier.trim())) {
      setMessage("Please enter a valid email or 10-digit mobile number");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setOtpSent(true);
        setOtpVerificationId(data.verificationId || "");
        setMessage(data.message || "OTP sent successfully");
        setMessageType("success");
        setCountdown(30);
      } else {
        setOtpVerificationId("");
        setMessage(data.message || "Failed to send OTP");
        setMessageType("error");
      }
    } catch {
      setLoading(false);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  const verifyOtp = async () => {
    if (!identifier.trim()) {
      setMessage("Please enter email or mobile number");
      setMessageType("error");
      return;
    }

    if (!isValidIdentifier(identifier.trim())) {
      setMessage("Please enter a valid email or 10-digit mobile number");
      setMessageType("error");
      return;
    }

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
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          otp: otp.trim(),
          verificationId: otpVerificationId || undefined,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        finishLogin(data.user, data.token);
      } else {
        setMessage(data.message || "Invalid OTP");
        setMessageType("error");
        setOtp("");
      }
    } catch {
      setLoading(false);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  const loginOrRegisterPassword = async () => {
    if (!identifier.trim()) {
      setMessage("Please enter email");
      setMessageType("error");
      return;
    }

    if (!validateEmail(identifier.trim())) {
      setMessage("Please enter a valid email address for password login");
      setMessageType("error");
      return;
    }

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
      const res = await fetch(`${BACKEND_URL}/api/auth/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        finishLogin(data.user, data.token);
      } else {
        setMessage(data.message || "Login failed");
        setMessageType("error");
      }
    } catch {
      setLoading(false);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  const requestPasswordReset = async () => {
    if (!identifier.trim()) {
      setMessage("Please enter email");
      setMessageType("error");
      return;
    }

    if (!validateEmail(identifier.trim())) {
      setMessage("Please enter a valid email address for password reset");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier.trim() }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setResetMode("verify");
        setMessage(data.message || "OTP sent to your email");
        setMessageType("success");
        setCountdown(30);
      } else {
        setMessage(data.message || "Failed to send reset email");
        setMessageType("error");
      }
    } catch {
      setLoading(false);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  const verifyPasswordResetOtp = async () => {
    if (!resetOtp.trim()) {
      setMessage("Please enter OTP");
      setMessageType("error");
      return;
    }

    if (!validateOtp(resetOtp)) {
      setMessage("OTP must be 6 digits");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.trim(),
          otp: resetOtp.trim(),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setResetToken(data.resetToken);
        setResetMode("reset");
        setMessage("OTP verified. Set your new password.");
        setMessageType("success");
      } else {
        setMessage(data.message || "Invalid OTP");
        setMessageType("error");
        setResetOtp("");
      }
    } catch {
      setLoading(false);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  const resetPassword = async () => {
    if (!newPassword.trim()) {
      setMessage("Please enter new password");
      setMessageType("error");
      return;
    }

    if (!validatePassword(newPassword)) {
      setMessage("Password must be at least 6 characters");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage("Password reset successfully. You can now login.");
        setMessageType("success");
        setTimeout(() => {
          setResetMode(null);
          setMode("password");
          setNewPassword("");
          setConfirmPassword("");
          setResetOtp("");
          setIdentifier("");
          setPassword("");
        }, 1500);
      } else {
        setMessage(data.message || "Failed to reset password");
        setMessageType("error");
      }
    } catch {
      setLoading(false);
      setMessage("Network error. Please try again.");
      setMessageType("error");
    }
  };

  const showIdentifierError =
    identifier.trim() &&
    (mode === "password"
      ? !validateEmail(identifier.trim())
      : !isValidIdentifier(identifier.trim()));

  const inputBase =
    "w-full rounded-lg border border-emerald-100 bg-white px-10 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";
  const primaryButton =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed";
  const secondaryButton =
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-5 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-popup-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative grid w-full max-w-[58rem] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/25 md:grid-cols-[0.92fr_1.08fr]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close auth popup"
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-red-50 hover:text-red-600 md:right-4 md:top-4"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <section className="relative hidden min-h-[34rem] overflow-hidden bg-emerald-950 p-8 text-white md:flex md:flex-col md:justify-between lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,0.32),transparent_34%),linear-gradient(150deg,#064e3b_0%,#047857_46%,#0f172a_100%)]" />
          <div className="relative">
            <Image
              src="/logos.png"
              alt="Verdora"
              width={132}
              height={78}
              priority
              className="h-auto w-28 brightness-0 invert"
            />
            <h2 className="mt-10 text-4xl font-bold leading-tight">
              Fresh access to your Verdora garden.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-emerald-50">
              Login or register in one clean flow to track orders, save
              favorites, and checkout faster.
            </p>
          </div>

          <div className="relative space-y-4 text-sm text-emerald-50">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>Secure OTP and password access</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/12">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>One account for shopping, wishlist, and orders</span>
            </div>
          </div>
        </section>

        <section className="max-h-[calc(100dvh-2rem)] overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 md:max-h-[calc(100dvh-4rem)] lg:px-10">
          <h1 id="auth-popup-title" className="sr-only">
            Verdora login or register
          </h1>

          <div className="mb-6 flex items-center gap-3 md:hidden">
            <Image
              src="/v-logo.png"
              alt="Verdora"
              width={48}
              height={48}
              priority
              className="h-11 w-11 rounded-full"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Verdora
              </p>
              <h2 className="text-lg font-bold text-slate-950">
                Login / Register
              </h2>
            </div>
          </div>

          <div className="hidden md:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Verdora Account
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Login / Register
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use OTP for quick access or a password to create and return to
              your account.
            </p>
          </div>

          {!resetMode && (
            <div className="mt-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("otp");
                  setMessage("");
                  setPassword("");
                }}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
                  mode === "otp"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setMessage("");
                  setOtp("");
                  setOtpSent(false);
                  setOtpVerificationId("");
                }}
                className={`flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition ${
                  mode === "password"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Password
              </button>
            </div>
          )}

          {resetMode && (
            <button
              type="button"
              onClick={() => {
                setResetMode(null);
                setMessage("");
                setResetOtp("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="mb-4 mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to login
            </button>
          )}

          <div className="mt-5 space-y-4">
            {(mode === "otp" || (mode === "password" && resetMode !== "reset")) && (
              <div>
                <label
                  htmlFor="auth-identifier"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  {mode === "password" ? "Email address" : "Email or mobile"}
                </label>
                <div className="relative">
                  {mode === "password" ? (
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <Phone
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
                      aria-hidden="true"
                    />
                  )}
                  <input
                    id="auth-identifier"
                    type="text"
                    inputMode={mode === "password" ? "email" : "text"}
                    autoComplete={mode === "password" ? "email" : "username"}
                    placeholder={
                      mode === "password"
                        ? "you@example.com"
                        : "Email or 10-digit mobile"
                    }
                    value={identifier}
                    onChange={(event) => {
                      setIdentifier(event.target.value);
                      if (otpSent) {
                        setOtpSent(false);
                        setOtp("");
                        setOtpVerificationId("");
                        setMessage("");
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !loading) {
                        event.preventDefault();
                        if (mode === "password" && !resetMode) {
                          loginOrRegisterPassword();
                        } else if (resetMode === "request") {
                          requestPasswordReset();
                        } else if (!otpSent) {
                          sendOtp();
                        }
                      }
                    }}
                    className={inputBase}
                    required
                  />
                </div>
                {showIdentifierError && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {mode === "password"
                      ? "Enter a valid email address"
                      : "Enter a valid email or 10-digit mobile number"}
                  </p>
                )}
              </div>
            )}

            {mode === "otp" && !resetMode && (
              <>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={
                      !identifier ||
                      !isValidIdentifier(identifier.trim()) ||
                      loading
                    }
                    className={primaryButton}
                  >
                    {loading ? <Spinner size="sm" /> : null}
                    Send OTP
                  </button>
                ) : (
                  <>
                    <div>
                      <label
                        htmlFor="auth-otp"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Verification code
                      </label>
                      <div className="relative">
                        <ShieldCheck
                          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
                          aria-hidden="true"
                        />
                        <input
                          id="auth-otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          value={otp}
                          onChange={(event) =>
                            setOtp(event.target.value.replace(/\D/g, ""))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !loading) {
                              event.preventDefault();
                              verifyOtp();
                            }
                          }}
                          className={inputBase}
                          required
                        />
                      </div>
                      {otp && !validateOtp(otp) && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          OTP must be 6 digits
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={!otp || !validateOtp(otp) || loading}
                      className={primaryButton}
                    >
                      {loading ? <Spinner size="sm" /> : null}
                      Verify OTP
                    </button>

                    <div className="text-center text-sm text-slate-500">
                      {countdown > 0 ? (
                        <span>Resend OTP in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={sendOtp}
                          className="font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {mode === "password" && !resetMode && (
              <>
                <div>
                  <label
                    htmlFor="auth-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
                      aria-hidden="true"
                    />
                    <input
                      id="auth-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !loading) {
                          event.preventDefault();
                          loginOrRegisterPassword();
                        }
                      }}
                      className={inputBase}
                      required
                    />
                  </div>
                  {password && !validatePassword(password) && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={loginOrRegisterPassword}
                  disabled={
                    !identifier ||
                    !validateEmail(identifier.trim()) ||
                    !password ||
                    !validatePassword(password) ||
                    loading
                  }
                  className={primaryButton}
                >
                  {loading ? <Spinner size="sm" /> : null}
                  Login / Register
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetMode("request");
                    setMessage("");
                    setPassword("");
                  }}
                  className="mx-auto block text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Forgot password?
                </button>
              </>
            )}

            {resetMode === "request" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">
                    Reset password
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your email and we will send a verification code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestPasswordReset}
                  disabled={
                    !identifier || !validateEmail(identifier.trim()) || loading
                  }
                  className={primaryButton}
                >
                  {loading ? <Spinner size="sm" /> : null}
                  Send Reset Code
                </button>
              </div>
            )}

            {resetMode === "verify" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">
                    Verify reset code
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Check your email for the 6-digit code.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="reset-otp"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Verification code
                  </label>
                  <div className="relative">
                    <ShieldCheck
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
                      aria-hidden="true"
                    />
                    <input
                      id="reset-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(event) =>
                        setResetOtp(event.target.value.replace(/\D/g, ""))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !loading) {
                          event.preventDefault();
                          verifyPasswordResetOtp();
                        }
                      }}
                      className={inputBase}
                      required
                    />
                  </div>
                  {resetOtp && !validateOtp(resetOtp) && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      OTP must be 6 digits
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={verifyPasswordResetOtp}
                  disabled={!resetOtp || !validateOtp(resetOtp) || loading}
                  className={primaryButton}
                >
                  {loading ? <Spinner size="sm" /> : null}
                  Verify OTP
                </button>

                <div className="text-center text-sm text-slate-500">
                  {countdown > 0 ? (
                    <span>Resend OTP in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={requestPasswordReset}
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {resetMode === "reset" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">
                    Set new password
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Choose a password with at least 6 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
                      aria-hidden="true"
                    />
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !loading) {
                          event.preventDefault();
                          resetPassword();
                        }
                      }}
                      className={inputBase}
                      required
                    />
                  </div>
                  {newPassword && !validatePassword(newPassword) && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600"
                      aria-hidden="true"
                    />
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !loading) {
                          event.preventDefault();
                          resetPassword();
                        }
                      }}
                      className={inputBase}
                      required
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetPassword}
                  disabled={
                    !newPassword ||
                    !validatePassword(newPassword) ||
                    newPassword !== confirmPassword ||
                    loading
                  }
                  className={primaryButton}
                >
                  {loading ? <Spinner size="sm" /> : null}
                  Reset Password
                </button>
              </div>
            )}

            {message && (
              <p
                className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${
                  messageType === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </p>
            )}

            {!resetMode && (
              <div className="rounded-lg bg-slate-50 px-3 py-3 text-center text-xs leading-5 text-slate-500">
                <UserRound
                  className="mx-auto mb-1 h-4 w-4 text-emerald-600"
                  aria-hidden="true"
                />
                New users are registered automatically after successful OTP or
                password verification.
              </div>
            )}

            {resetMode && (
              <button
                type="button"
                onClick={() => setResetMode(null)}
                className={secondaryButton}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Login
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
