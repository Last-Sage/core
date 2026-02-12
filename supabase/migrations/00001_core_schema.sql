-- ============================================
-- CORE SCHEMA: Plugin-First Business OS Platform
-- Migration: 00001_core_schema.sql
-- ============================================

-- Create core schema
CREATE SCHEMA IF NOT EXISTS core;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ORGANIZATIONS (Tenants)
-- ============================================
CREATE TABLE core.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  schema_name TEXT GENERATED ALWAYS AS ('tenant_' || REPLACE(id::TEXT, '-', '_')) STORED,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_owner ON core.organizations(owner_id);
CREATE INDEX idx_organizations_slug ON core.organizations(slug);
CREATE INDEX idx_organizations_settings ON core.organizations USING GIN(settings);

-- ============================================
-- USERS (Extended profile linked to auth.users)
-- ============================================
CREATE TABLE core.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_org ON core.users(org_id);
CREATE INDEX idx_users_email ON core.users(email);
CREATE INDEX idx_users_metadata ON core.users USING GIN(metadata);

-- ============================================
-- ROLES
-- ============================================
CREATE TABLE core.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE, -- NULL = system/global role
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, name)
);

CREATE INDEX idx_roles_org ON core.roles(org_id);
CREATE INDEX idx_roles_system ON core.roles(is_system) WHERE is_system = TRUE;

-- ============================================
-- PERMISSIONS
-- ============================================
CREATE TABLE core.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- e.g., 'users:read', 'plugins:manage'
  name TEXT NOT NULL,
  description TEXT,
  resource TEXT NOT NULL, -- e.g., 'users', 'plugins', 'settings'
  action TEXT NOT NULL, -- e.g., 'read', 'write', 'delete', 'manage'
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_permissions_code ON core.permissions(code);
CREATE INDEX idx_permissions_resource ON core.permissions(resource);

-- ============================================
-- USER-ROLE MAPPING
-- ============================================
CREATE TABLE core.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES core.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = never expires
  UNIQUE(user_id, role_id, org_id)
);

CREATE INDEX idx_user_roles_user ON core.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON core.user_roles(role_id);
CREATE INDEX idx_user_roles_org ON core.user_roles(org_id);

-- ============================================
-- ROLE-PERMISSION MAPPING
-- ============================================
CREATE TABLE core.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES core.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES core.permissions(id) ON DELETE CASCADE,
  conditions JSONB DEFAULT '{}', -- Optional conditions/constraints
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON core.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON core.role_permissions(permission_id);

-- ============================================
-- PLUGINS (Global Registry)
-- ============================================
CREATE TABLE core.plugins (
  id TEXT PRIMARY KEY, -- e.g., 'notes', 'invoicing'
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  schema_name TEXT GENERATED ALWAYS AS ('plugin_' || id) STORED,
  author TEXT,
  homepage TEXT,
  permissions JSONB DEFAULT '[]', -- Permissions this plugin declares
  nav_items JSONB DEFAULT '[]', -- Navigation items to inject
  dependencies JSONB DEFAULT '[]', -- Other plugins required
  config_schema JSONB DEFAULT '{}', -- JSON Schema for plugin config
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE, -- Cannot be uninstalled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plugins_active ON core.plugins(is_active) WHERE is_active = TRUE;

-- ============================================
-- PLUGIN INSTALLATIONS (Per-Org)
-- ============================================
CREATE TYPE core.plugin_state AS ENUM ('installed', 'enabled', 'disabled', 'error');

CREATE TABLE core.plugin_installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  plugin_id TEXT NOT NULL REFERENCES core.plugins(id) ON DELETE RESTRICT,
  state core.plugin_state NOT NULL DEFAULT 'installed',
  version TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  installed_by UUID REFERENCES core.users(id),
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  enabled_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE(org_id, plugin_id)
);

CREATE INDEX idx_plugin_installations_org ON core.plugin_installations(org_id);
CREATE INDEX idx_plugin_installations_plugin ON core.plugin_installations(plugin_id);
CREATE INDEX idx_plugin_installations_state ON core.plugin_installations(state);

-- ============================================
-- EVENTS (Event Bus)
-- ============================================
CREATE TABLE core.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- e.g., 'user.created', 'plugin.installed'
  source TEXT NOT NULL, -- e.g., 'core', 'plugin:notes'
  payload JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  emitted_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX idx_events_org ON core.events(org_id);
CREATE INDEX idx_events_type ON core.events(type);
CREATE INDEX idx_events_unprocessed ON core.events(processed, emitted_at) WHERE processed = FALSE;
CREATE INDEX idx_events_payload ON core.events USING GIN(payload);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE core.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- e.g., 'create', 'update', 'delete'
  resource_type TEXT NOT NULL, -- e.g., 'user', 'role', 'plugin'
  resource_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON core.audit_logs(org_id);
CREATE INDEX idx_audit_logs_user ON core.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON core.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON core.audit_logs(created_at DESC);

-- ============================================
-- SYSTEM ROLES (Default)
-- ============================================
INSERT INTO core.roles (id, org_id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'owner', 'Organization owner with full access', TRUE),
  ('00000000-0000-0000-0000-000000000002', NULL, 'admin', 'Administrator with management access', TRUE),
  ('00000000-0000-0000-0000-000000000003', NULL, 'member', 'Regular member with basic access', TRUE),
  ('00000000-0000-0000-0000-000000000004', NULL, 'viewer', 'Read-only access', TRUE);

-- ============================================
-- SYSTEM PERMISSIONS (Default)
-- ============================================
INSERT INTO core.permissions (code, name, description, resource, action, is_system) VALUES
  -- Organization
  ('org:read', 'View Organization', 'View organization details', 'org', 'read', TRUE),
  ('org:update', 'Update Organization', 'Update organization settings', 'org', 'update', TRUE),
  ('org:delete', 'Delete Organization', 'Delete the organization', 'org', 'delete', TRUE),
  -- Users
  ('users:read', 'View Users', 'View user list', 'users', 'read', TRUE),
  ('users:create', 'Create Users', 'Invite new users', 'users', 'create', TRUE),
  ('users:update', 'Update Users', 'Edit user profiles', 'users', 'update', TRUE),
  ('users:delete', 'Delete Users', 'Remove users', 'users', 'delete', TRUE),
  -- Roles
  ('roles:read', 'View Roles', 'View roles', 'roles', 'read', TRUE),
  ('roles:manage', 'Manage Roles', 'Create, edit, delete roles', 'roles', 'manage', TRUE),
  -- Plugins
  ('plugins:read', 'View Plugins', 'View available plugins', 'plugins', 'read', TRUE),
  ('plugins:install', 'Install Plugins', 'Install new plugins', 'plugins', 'install', TRUE),
  ('plugins:manage', 'Manage Plugins', 'Enable, disable, configure plugins', 'plugins', 'manage', TRUE),
  -- Settings
  ('settings:read', 'View Settings', 'View settings', 'settings', 'read', TRUE),
  ('settings:update', 'Update Settings', 'Modify settings', 'settings', 'update', TRUE),
  -- Audit
  ('audit:read', 'View Audit Logs', 'View audit logs', 'audit', 'read', TRUE);

-- ============================================
-- DEFAULT ROLE-PERMISSION MAPPINGS
-- ============================================
-- Owner gets everything
INSERT INTO core.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM core.permissions WHERE is_system = TRUE;

-- Admin gets most things except org:delete
INSERT INTO core.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM core.permissions 
WHERE is_system = TRUE AND code NOT IN ('org:delete');

-- Member gets read + own profile
INSERT INTO core.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM core.permissions 
WHERE is_system = TRUE AND code IN ('org:read', 'users:read', 'plugins:read', 'settings:read');

-- Viewer gets read only
INSERT INTO core.role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM core.permissions 
WHERE is_system = TRUE AND action = 'read';

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION core.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON core.organizations
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON core.users
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at();

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON core.roles
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at();

CREATE TRIGGER trg_plugins_updated_at
  BEFORE UPDATE ON core.plugins
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at();
