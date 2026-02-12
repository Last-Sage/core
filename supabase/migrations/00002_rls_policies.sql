-- ============================================
-- RLS POLICIES: Plugin-First Business OS Platform
-- Migration: 00002_rls_policies.sql
-- ============================================

-- Enable RLS on all core tables
ALTER TABLE core.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.plugin_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Get user's org_id
-- ============================================
CREATE OR REPLACE FUNCTION core.get_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT org_id FROM core.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Check if user has permission
-- ============================================
CREATE OR REPLACE FUNCTION core.has_permission(permission_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM core.user_roles ur
    JOIN core.role_permissions rp ON rp.role_id = ur.role_id
    JOIN core.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND ur.org_id = core.get_user_org_id()
      AND p.code = permission_code
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO has_perm;
  
  RETURN COALESCE(has_perm, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER FUNCTION: Check if user is org owner
-- ============================================
CREATE OR REPLACE FUNCTION core.is_org_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM core.organizations 
    WHERE id = core.get_user_org_id() 
      AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================

-- Users can view their own organization
CREATE POLICY "org_select_own" ON core.organizations
  FOR SELECT USING (
    id = core.get_user_org_id()
    OR owner_id = auth.uid()
  );

-- Only owner can update organization
CREATE POLICY "org_update_owner" ON core.organizations
  FOR UPDATE USING (owner_id = auth.uid());

-- Only owner can delete organization
CREATE POLICY "org_delete_owner" ON core.organizations
  FOR DELETE USING (owner_id = auth.uid());

-- Authenticated users can create organizations (onboarding)
CREATE POLICY "org_insert_authenticated" ON core.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can view users in their organization
CREATE POLICY "users_select_org" ON core.users
  FOR SELECT USING (org_id = core.get_user_org_id());

-- Users can update their own profile
CREATE POLICY "users_update_self" ON core.users
  FOR UPDATE USING (id = auth.uid());

-- Admins can update any user in org
CREATE POLICY "users_update_admin" ON core.users
  FOR UPDATE USING (
    org_id = core.get_user_org_id() 
    AND core.has_permission('users:update')
  );

-- Admins can delete users (except self)
CREATE POLICY "users_delete_admin" ON core.users
  FOR DELETE USING (
    org_id = core.get_user_org_id() 
    AND id != auth.uid()
    AND core.has_permission('users:delete')
  );

-- New users can be created by admins
CREATE POLICY "users_insert_admin" ON core.users
  FOR INSERT WITH CHECK (
    org_id = core.get_user_org_id() 
    AND core.has_permission('users:create')
  );

-- Allow self-insert during onboarding
CREATE POLICY "users_insert_self" ON core.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================
-- ROLES POLICIES
-- ============================================

-- Users can view system roles and their org's roles
CREATE POLICY "roles_select" ON core.roles
  FOR SELECT USING (
    org_id IS NULL -- System roles
    OR org_id = core.get_user_org_id()
  );

-- Only admins can manage custom roles
CREATE POLICY "roles_insert" ON core.roles
  FOR INSERT WITH CHECK (
    org_id = core.get_user_org_id() 
    AND core.has_permission('roles:manage')
  );

CREATE POLICY "roles_update" ON core.roles
  FOR UPDATE USING (
    org_id = core.get_user_org_id() 
    AND is_system = FALSE
    AND core.has_permission('roles:manage')
  );

CREATE POLICY "roles_delete" ON core.roles
  FOR DELETE USING (
    org_id = core.get_user_org_id() 
    AND is_system = FALSE
    AND core.has_permission('roles:manage')
  );

-- ============================================
-- USER_ROLES POLICIES
-- ============================================

-- Users can view role assignments in their org
CREATE POLICY "user_roles_select" ON core.user_roles
  FOR SELECT USING (org_id = core.get_user_org_id());

-- Admins can manage role assignments
CREATE POLICY "user_roles_insert" ON core.user_roles
  FOR INSERT WITH CHECK (
    org_id = core.get_user_org_id() 
    AND core.has_permission('roles:manage')
  );

CREATE POLICY "user_roles_delete" ON core.user_roles
  FOR DELETE USING (
    org_id = core.get_user_org_id() 
    AND core.has_permission('roles:manage')
  );

-- ============================================
-- ROLE_PERMISSIONS POLICIES (Read-only for most)
-- ============================================

-- Everyone can read role permissions
CREATE POLICY "role_permissions_select" ON core.role_permissions
  FOR SELECT USING (TRUE);

-- Only for custom roles in own org
CREATE POLICY "role_permissions_insert" ON core.role_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.roles 
      WHERE id = role_id 
        AND org_id = core.get_user_org_id()
        AND is_system = FALSE
    )
    AND core.has_permission('roles:manage')
  );

CREATE POLICY "role_permissions_delete" ON core.role_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM core.roles 
      WHERE id = role_id 
        AND org_id = core.get_user_org_id()
        AND is_system = FALSE
    )
    AND core.has_permission('roles:manage')
  );

-- ============================================
-- PLUGIN_INSTALLATIONS POLICIES
-- ============================================

-- Users can view installed plugins in their org
CREATE POLICY "plugin_installations_select" ON core.plugin_installations
  FOR SELECT USING (org_id = core.get_user_org_id());

-- Only admins can install plugins
CREATE POLICY "plugin_installations_insert" ON core.plugin_installations
  FOR INSERT WITH CHECK (
    org_id = core.get_user_org_id() 
    AND core.has_permission('plugins:install')
  );

-- Only admins can manage plugins
CREATE POLICY "plugin_installations_update" ON core.plugin_installations
  FOR UPDATE USING (
    org_id = core.get_user_org_id() 
    AND core.has_permission('plugins:manage')
  );

CREATE POLICY "plugin_installations_delete" ON core.plugin_installations
  FOR DELETE USING (
    org_id = core.get_user_org_id() 
    AND core.has_permission('plugins:manage')
  );

-- ============================================
-- EVENTS POLICIES
-- ============================================

-- Users can view events in their org
CREATE POLICY "events_select" ON core.events
  FOR SELECT USING (org_id = core.get_user_org_id());

-- System/plugins can insert events (via service role or functions)
CREATE POLICY "events_insert" ON core.events
  FOR INSERT WITH CHECK (org_id = core.get_user_org_id());

-- ============================================
-- AUDIT_LOGS POLICIES
-- ============================================

-- Only users with audit permission can view logs
CREATE POLICY "audit_logs_select" ON core.audit_logs
  FOR SELECT USING (
    org_id = core.get_user_org_id() 
    AND core.has_permission('audit:read')
  );

-- Audit logs are insert-only (via triggers/functions)
CREATE POLICY "audit_logs_insert" ON core.audit_logs
  FOR INSERT WITH CHECK (org_id = core.get_user_org_id());

-- No one can update or delete audit logs
-- (No UPDATE or DELETE policies = blocked)
