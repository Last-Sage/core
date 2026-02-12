"use client";

import { ReactNode } from "react";
import { useRBAC } from "./provider";

/**
 * Hook to check a single permission
 */
export function usePermission(permission: string): boolean {
  const { hasPermission, loading } = useRBAC();
  if (loading) return false;
  return hasPermission(permission);
}

/**
 * Hook to check multiple permissions (any)
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission, loading } = useRBAC();
  if (loading) return false;
  return hasAnyPermission(permissions);
}

/**
 * Hook to check if user has a specific role
 */
export function useRole(role: string): boolean {
  const { hasRole, loading } = useRBAC();
  if (loading) return false;
  return hasRole(role);
}

/**
 * Hook to get current organization
 */
export function useOrganization() {
  const { organization, loading } = useRBAC();
  return { organization, loading };
}

/**
 * Hook to get user profile
 */
export function useProfile() {
  const { profile, loading } = useRBAC();
  return { profile, loading };
}

interface PermissionGateProps {
  permission: string | string[];
  mode?: "any" | "all";
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render based on permissions
 */
export function PermissionGate({
  permission,
  mode = "any",
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = useRBAC();

  if (loading) {
    return null;
  }

  const perms = Array.isArray(permission) ? permission : [permission];
  
  let hasAccess = false;
  if (perms.length === 1) {
    hasAccess = hasPermission(perms[0]);
  } else if (mode === "any") {
    hasAccess = hasAnyPermission(perms);
  } else {
    hasAccess = hasAllPermissions(perms);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface RoleGateProps {
  role: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render based on roles
 */
export function RoleGate({ role, children, fallback = null }: RoleGateProps) {
  const { hasRole, loading } = useRBAC();

  if (loading) {
    return null;
  }

  const roles = Array.isArray(role) ? role : [role];
  const hasAccess = roles.some((r) => hasRole(r));

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
