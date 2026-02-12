"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/hooks";

interface UserProfile {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface RBACContextType {
  profile: UserProfile | null;
  organization: Organization | null;
  roles: string[];
  permissions: string[];
  loading: boolean;
  error: Error | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  refresh: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | null>(null);

export function RBACProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadUserAccess = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setOrganization(null);
      setRoles([]);
      setPermissions([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      
      // PERF-001: Parallel queries instead of sequential
      const [profileResult, accessResult] = await Promise.all([
        supabase
          .from("users")
          .select("id, org_id, email, full_name, avatar_url")
          .eq("id", user.id)
          .single(),
        supabase
          .from("v_user_access")
          .select("roles, permissions")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (profileResult.error) throw profileResult.error;
      
      const profileData = profileResult.data;
      if (profileData) {
        setProfile(profileData);

        // Get organization (depends on profile.org_id)
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("id, name, slug")
          .eq("id", profileData.org_id)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);

        // Set roles and permissions from parallel query
        if (accessResult.data) {
          setRoles(accessResult.data.roles || []);
          setPermissions(accessResult.data.permissions || []);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load user access");
      setError(error);
      console.error("Failed to load user access:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserAccess();
  }, [loadUserAccess]);

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: string[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  }, [permissions]);

  const hasAllPermissions = useCallback((perms: string[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  }, [permissions]);

  const hasRole = useCallback((role: string): boolean => {
    return roles.includes(role);
  }, [roles]);

  return (
    <RBACContext.Provider
      value={{
        profile,
        organization,
        roles,
        permissions,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        refresh: loadUserAccess,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within RBACProvider");
  }
  return context;
}

