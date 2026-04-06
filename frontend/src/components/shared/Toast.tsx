"use client";
import { useEffect, useState } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  onClose?: () => void;
}

export default function Toast({
  message,
  type,
  duration = 4000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible || !message) return null;

  const bgColor = {
    success: "bg-green-100 border-green-300",
    error: "bg-red-100 border-red-300",
    info: "bg-blue-100 border-blue-300",
    warning: "bg-yellow-100 border-yellow-300",
  }[type];

  const textColor = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
    warning: "text-yellow-800",
  }[type];

  const Icon = {
    success: CheckCircleIcon,
    error: ExclamationCircleIcon,
    info: InformationCircleIcon,
    warning: ExclamationCircleIcon,
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 max-w-sm border rounded-lg shadow-lg p-4 flex items-start gap-3 z-50 animate-pulse ${bgColor}`}
    >
      <Icon className={`w-6 h-6 shrink-0 ${textColor}`} />
      <div className={`text-sm font-medium ${textColor}`}>
        {message}
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className={`text-lg leading-none ${textColor} opacity-70 hover:opacity-100 ml-auto`}
      >
        ×
      </button>
    </div>
  );
}
