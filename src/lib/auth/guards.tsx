"use client";

import { ReactNode } from "react";
import { useAuth } from "@/lib/auth/hooks";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Protects content - only renders children if user is authenticated
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

interface RedirectGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Redirects unauthenticated users to login
 */
export function RedirectGuard({ children, redirectTo = "/login" }: RedirectGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
    return null;
  }

  return <>{children}</>;
}
