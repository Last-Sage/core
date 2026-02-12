/**
 * Core system permissions
 * Plugin permissions are registered dynamically
 */
export const CORE_PERMISSIONS = {
  // Organization
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_DELETE: "org:delete",

  // Users
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",

  // Roles
  ROLES_READ: "roles:read",
  ROLES_MANAGE: "roles:manage",

  // Plugins
  PLUGINS_READ: "plugins:read",
  PLUGINS_INSTALL: "plugins:install",
  PLUGINS_MANAGE: "plugins:manage",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",

  // Audit
  AUDIT_READ: "audit:read",
} as const;

export type CorePermission = typeof CORE_PERMISSIONS[keyof typeof CORE_PERMISSIONS];

/**
 * System roles
 */
export const SYSTEM_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

/**
 * Permission groups for UI display
 */
export const PERMISSION_GROUPS = {
  organization: {
    label: "Organization",
    permissions: ["org:read", "org:update", "org:delete"],
  },
  users: {
    label: "Users",
    permissions: ["users:read", "users:create", "users:update", "users:delete"],
  },
  roles: {
    label: "Roles",
    permissions: ["roles:read", "roles:manage"],
  },
  plugins: {
    label: "Plugins",
    permissions: ["plugins:read", "plugins:install", "plugins:manage"],
  },
  settings: {
    label: "Settings",
    permissions: ["settings:read", "settings:update"],
  },
  audit: {
    label: "Audit Logs",
    permissions: ["audit:read"],
  },
};
