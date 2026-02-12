"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { PluginInfo, PluginNavItem } from "./types";
import { PluginRegistry } from "./registry";
import { useRBAC } from "@/lib/rbac/provider";

/**
 * Hook to get installed plugins for current org
 */
export function usePlugins() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organization } = useRBAC();

  const supabase = getSupabaseClient();

  const loadPlugins = async () => {
    if (!organization) {
      setPlugins([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("v_org_plugins")
        .select("*")
        .eq("org_id", organization.id);

      if (fetchError) throw fetchError;
      setPlugins(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlugins();
  }, [organization?.id]);

  return { plugins, loading, error, refresh: loadPlugins };
}

/**
 * Hook to get available plugins (from global registry)
 */
export function useAvailablePlugins() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("plugins")
        .select("*")
        .eq("is_active", true);

      setPlugins(
        (data || []).map((p: { id: string; name: string; description: string | null; version: string; author: string | null; nav_items: unknown; permissions: string[] }) => ({
          plugin_id: p.id,
          name: p.name,
          description: p.description,
          latest_version: p.version,
          author: p.author,
          nav_items: p.nav_items,
          declared_permissions: p.permissions,
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  return { plugins, loading };
}

/**
 * Hook to install a plugin
 */
export function useInstallPlugin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { organization } = useRBAC();
  const supabase = getSupabaseClient();

  const install = async (pluginId: string): Promise<boolean> => {
    if (!organization) {
      setError(new Error("No organization"));
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: rpcError } = await supabase.rpc("install_plugin", {
        p_org_id: organization.id,
        p_plugin_id: pluginId,
      });

      if (rpcError) throw rpcError;
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { install, loading, error };
}

/**
 * Hook to enable/disable a plugin
 */
export function usePluginState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { organization } = useRBAC();
  const supabase = getSupabaseClient();

  const enable = async (pluginId: string): Promise<boolean> => {
    if (!organization) {
      setError(new Error("No organization"));
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc("enable_plugin", {
        p_org_id: organization.id,
        p_plugin_id: pluginId,
      });
      if (rpcError) throw rpcError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to enable plugin"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disable = async (pluginId: string): Promise<boolean> => {
    if (!organization) {
      setError(new Error("No organization"));
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc("disable_plugin", {
        p_org_id: organization.id,
        p_plugin_id: pluginId,
      });
      if (rpcError) throw rpcError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to disable plugin"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { enable, disable, loading, error };
}

/**
 * Hook to get nav items from enabled plugins
 */
export function usePluginNav(): PluginNavItem[] {
  const { plugins, loading } = usePlugins();

  if (loading) return [];

  // Get nav items from enabled plugins only
  const enabledPlugins = plugins.filter((p) => p.state === "enabled");
  
  return enabledPlugins
    .flatMap((p) => p.nav_items || [])
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Hook to get runtime-registered plugins
 */
export function useRegisteredPlugins() {
  return PluginRegistry.getAll();
}
