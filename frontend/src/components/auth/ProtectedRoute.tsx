"use client";
import { useEffect, useState } from "react";
import AuthPopup from "./AuthPop"; // import your popup
import Spinner from "../shared/Spinner";

interface User {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const storedUser =
        typeof window !== "undefined" ? localStorage.getItem("user") : null;

      if (!token) {
        setShowAuth(true); // ✅ show popup instead of redirect
        setAuthenticated(false);
      } else {
        setAuthenticated(true);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (when logout happens in another tab or window)
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!authenticated && showAuth) {
    return (
      <AuthPopup
        onClose={() => {
          setShowAuth(false);
          window.location.href = "/"; // ✅ redirect home on close
        }}
        onLogin={(u: User) => {
          setUser(u);
          setAuthenticated(true);
          setShowAuth(false);
        }}
      />
    );
  }

  return authenticated ? <>{children}</> : null;
}
