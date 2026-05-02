"use client";
import styles from "./OtpInput.module.css";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * OTP Input Component
 * Provides a user-friendly OTP input with individual digit boxes
 */
export default function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
}: OtpInputProps) {
  const otp = value.padEnd(length, "").split("").slice(0, length);

  const handleChange = (index: number, val: string) => {
    if (disabled) return;

    // Allow only digits
    const digit = val.replace(/[^\d]/g, "");

    if (digit.length > 1) {
      // Handle paste
      const paste = digit.slice(0, length - index);
      const newOtp = [...otp];
      for (let i = 0; i < paste.length && index + i < length; i++) {
        newOtp[index + i] = paste[i];
      }
      onChange(newOtp.join(""));

      // Focus last filled input
      const nextEmpty = newOtp.findIndex((v) => !v);
      if (nextEmpty !== -1 && nextEmpty < length) {
        setTimeout(() => {
          const input = document.getElementById(`otp-${nextEmpty}`);
          input?.focus();
        }, 0);
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digit;
    onChange(newOtp.join(""));

    // Move to next input
    if (digit && index < length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className={styles.otpContainer}>
      {otp.map((digit, index) => (
        <input
          key={index}
          id={`otp-${index}`}
          type="text"
          maxLength={2}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className={`${styles.otpInput} ${digit ? styles.filled : ""} ${disabled ? styles.disabled : ""}`}
          inputMode="numeric"
        />
      ))}
    </div>
  );
}
