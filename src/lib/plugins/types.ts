import { LucideIcon } from "lucide-react";

/**
 * Plugin manifest definition
 */
export interface PluginManifest {
  /** Unique plugin identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description?: string;
  /** Semantic version */
  version: string;
  /** Author/team name */
  author?: string;
  /** Plugin homepage URL */
  homepage?: string;
  /** Permissions this plugin declares */
  permissions: string[];
  /** Dependencies on other plugins */
  dependencies?: string[];
  /** Navigation items to inject */
  nav?: PluginNavItem[];
  /** Schema name for plugin data */
  schema: string;
  /** Plugin settings schema (JSON Schema) */
  configSchema?: Record<string, unknown>;
}

/**
 * Navigation item injected by plugin
 */
export interface PluginNavItem {
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Icon name (Lucide icon) */
  icon: string;
  /** Parent menu (for nested nav) */
  parent?: string;
  /** Sort order */
  order?: number;
}

/**
 * Plugin installation state
 */
export type PluginState = "installed" | "enabled" | "disabled" | "error";

/**
 * Plugin installation record
 */
export interface PluginInstallation {
  id: string;
  org_id: string;
  plugin_id: string;
  state: PluginState;
  version: string;
  config: Record<string, unknown>;
  installed_at: string;
  enabled_at?: string;
  last_error?: string;
}

/**
 * Full plugin info (from registry + installation)
 */
export interface PluginInfo {
  // From registry
  plugin_id: string;
  name: string;
  description?: string;
  latest_version: string;
  author?: string;
  nav_items?: PluginNavItem[];
  declared_permissions?: string[];
  // From installation (if installed)
  state?: PluginState;
  installed_version?: string;
  installed_at?: string;
  enabled_at?: string;
}

/**
 * Plugin component registration
 */
export interface PluginComponent {
  /** Component render function */
  Component: React.ComponentType;
  /** Route path for this component */
  path: string;
  /** Required permission to view */
  permission?: string;
}

/**
 * Event handler for plugin events
 */
export type PluginEventHandler = (payload: Record<string, unknown>) => void | Promise<void>;

/**
 * Plugin SDK interface for runtime registration
 */
export interface PluginSDK {
  /** Plugin manifest */
  manifest: PluginManifest;
  
  /** Register route components */
  routes: PluginComponent[];
  
  /** Event subscriptions */
  subscriptions: {
    eventType: string;
    handler: PluginEventHandler;
  }[];
  
  /** Initialization function (called when enabled) */
  onEnable?: () => Promise<void>;
  
  /** Cleanup function (called when disabled) */
  onDisable?: () => Promise<void>;
}
