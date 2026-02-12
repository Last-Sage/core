-- ============================================
-- DATABASE FUNCTIONS: Plugin-First Business OS Platform
-- Migration: 00003_functions.sql
-- ============================================

-- ============================================
-- CREATE TENANT SCHEMA
-- Called when a new organization is created
-- ============================================
CREATE OR REPLACE FUNCTION core.create_tenant_schema(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  schema_name TEXT;
BEGIN
  -- Generate schema name from org_id
  schema_name := 'tenant_' || REPLACE(p_org_id::TEXT, '-', '_');
  
  -- Create the schema
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  
  -- Grant usage to authenticated role
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema_name);
  EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO authenticated', schema_name);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO authenticated', schema_name);
  
  RETURN schema_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DROP TENANT SCHEMA
-- Called when an organization is deleted
-- ============================================
CREATE OR REPLACE FUNCTION core.drop_tenant_schema(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  schema_name TEXT;
BEGIN
  schema_name := 'tenant_' || REPLACE(p_org_id::TEXT, '-', '_');
  EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INSTALL PLUGIN
-- Creates plugin schema and registers installation
-- ============================================
CREATE OR REPLACE FUNCTION core.install_plugin(
  p_org_id UUID,
  p_plugin_id TEXT,
  p_installed_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_installation_id UUID;
  v_plugin core.plugins%ROWTYPE;
  v_schema_name TEXT;
BEGIN
  -- Get plugin info
  SELECT * INTO v_plugin FROM core.plugins WHERE id = p_plugin_id;
  
  IF v_plugin.id IS NULL THEN
    RAISE EXCEPTION 'Plugin % not found', p_plugin_id;
  END IF;
  
  IF NOT v_plugin.is_active THEN
    RAISE EXCEPTION 'Plugin % is not active', p_plugin_id;
  END IF;
  
  -- Check if already installed
  IF EXISTS (
    SELECT 1 FROM core.plugin_installations 
    WHERE org_id = p_org_id AND plugin_id = p_plugin_id
  ) THEN
    RAISE EXCEPTION 'Plugin % already installed for this organization', p_plugin_id;
  END IF;
  
  -- Create plugin schema (if not exists)
  v_schema_name := 'plugin_' || p_plugin_id;
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', v_schema_name);
  
  -- Grant permissions
  EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', v_schema_name);
  EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO authenticated', v_schema_name);
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO authenticated', v_schema_name);
  
  -- Register installation
  INSERT INTO core.plugin_installations (
    org_id, plugin_id, state, version, installed_by
  ) VALUES (
    p_org_id, p_plugin_id, 'installed', v_plugin.version, COALESCE(p_installed_by, auth.uid())
  ) RETURNING id INTO v_installation_id;
  
  -- Emit event
  PERFORM core.emit_event(p_org_id, 'plugin.installed', 'core', jsonb_build_object(
    'plugin_id', p_plugin_id,
    'version', v_plugin.version,
    'installed_by', COALESCE(p_installed_by, auth.uid())
  ));
  
  RETURN v_installation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENABLE PLUGIN
-- ============================================
CREATE OR REPLACE FUNCTION core.enable_plugin(p_org_id UUID, p_plugin_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE core.plugin_installations 
  SET state = 'enabled', enabled_at = NOW()
  WHERE org_id = p_org_id AND plugin_id = p_plugin_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plugin installation not found';
  END IF;
  
  PERFORM core.emit_event(p_org_id, 'plugin.enabled', 'core', jsonb_build_object(
    'plugin_id', p_plugin_id
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DISABLE PLUGIN
-- ============================================
CREATE OR REPLACE FUNCTION core.disable_plugin(p_org_id UUID, p_plugin_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE core.plugin_installations 
  SET state = 'disabled', enabled_at = NULL
  WHERE org_id = p_org_id AND plugin_id = p_plugin_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plugin installation not found';
  END IF;
  
  PERFORM core.emit_event(p_org_id, 'plugin.disabled', 'core', jsonb_build_object(
    'plugin_id', p_plugin_id
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UNINSTALL PLUGIN
-- ============================================
CREATE OR REPLACE FUNCTION core.uninstall_plugin(p_org_id UUID, p_plugin_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_plugin core.plugins%ROWTYPE;
BEGIN
  SELECT * INTO v_plugin FROM core.plugins WHERE id = p_plugin_id;
  
  IF v_plugin.is_system THEN
    RAISE EXCEPTION 'Cannot uninstall system plugin %', p_plugin_id;
  END IF;
  
  DELETE FROM core.plugin_installations 
  WHERE org_id = p_org_id AND plugin_id = p_plugin_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plugin installation not found';
  END IF;
  
  PERFORM core.emit_event(p_org_id, 'plugin.uninstalled', 'core', jsonb_build_object(
    'plugin_id', p_plugin_id
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CHECK PERMISSION
-- ============================================
CREATE OR REPLACE FUNCTION core.check_permission(
  p_user_id UUID,
  p_permission_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM core.user_roles ur
    JOIN core.role_permissions rp ON rp.role_id = ur.role_id
    JOIN core.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND p.code = p_permission_code
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_permission;
  
  RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- GET USER PERMISSIONS
-- Returns all permission codes for a user
-- ============================================
CREATE OR REPLACE FUNCTION core.get_user_permissions(p_user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT p.code
    FROM core.user_roles ur
    JOIN core.role_permissions rp ON rp.role_id = ur.role_id
    JOIN core.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY p.code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- EMIT EVENT
-- ============================================
CREATE OR REPLACE FUNCTION core.emit_event(
  p_org_id UUID,
  p_type TEXT,
  p_source TEXT,
  p_payload JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO core.events (org_id, type, source, payload)
  VALUES (p_org_id, p_type, p_source, p_payload)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CONSUME EVENTS
-- Returns unprocessed events and marks them as processed
-- ============================================
CREATE OR REPLACE FUNCTION core.consume_events(
  p_org_id UUID,
  p_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS SETOF core.events AS $$
BEGIN
  RETURN QUERY
  WITH consumed AS (
    SELECT id FROM core.events
    WHERE org_id = p_org_id
      AND processed = FALSE
      AND (p_types IS NULL OR type = ANY(p_types))
    ORDER BY emitted_at
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE core.events e
  SET processed = TRUE, processed_at = NOW()
  FROM consumed c
  WHERE e.id = c.id
  RETURNING e.*;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE AUDIT LOG
-- ============================================
CREATE OR REPLACE FUNCTION core.create_audit_log(
  p_org_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO core.audit_logs (
    org_id, user_id, action, resource_type, resource_id,
    old_values, new_values, metadata
  ) VALUES (
    p_org_id, p_user_id, p_action, p_resource_type, p_resource_id,
    p_old_values, p_new_values, p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ONBOARDING: Create organization + user profile
-- Called after Supabase Auth signup
-- ============================================
CREATE OR REPLACE FUNCTION core.onboard_user(
  p_org_name TEXT,
  p_org_slug TEXT,
  p_user_full_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID := auth.uid();
  v_user_email TEXT;
BEGIN
  -- Get user email from auth
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  
  -- Create organization
  INSERT INTO core.organizations (name, slug, owner_id)
  VALUES (p_org_name, p_org_slug, v_user_id)
  RETURNING id INTO v_org_id;
  
  -- Create user profile
  INSERT INTO core.users (id, org_id, email, full_name)
  VALUES (v_user_id, v_org_id, v_user_email, p_user_full_name);
  
  -- Assign owner role
  INSERT INTO core.user_roles (user_id, role_id, org_id, granted_by)
  VALUES (v_user_id, '00000000-0000-0000-0000-000000000001', v_org_id, v_user_id);
  
  -- Create tenant schema
  PERFORM core.create_tenant_schema(v_org_id);
  
  -- Emit event
  PERFORM core.emit_event(v_org_id, 'org.created', 'core', jsonb_build_object(
    'org_name', p_org_name,
    'owner_id', v_user_id
  ));
  
  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- User with roles and permissions
CREATE OR REPLACE VIEW core.v_user_access AS
SELECT 
  u.id AS user_id,
  u.org_id,
  u.email,
  u.full_name,
  ARRAY_AGG(DISTINCT r.name) AS roles,
  ARRAY_AGG(DISTINCT p.code) AS permissions
FROM core.users u
LEFT JOIN core.user_roles ur ON ur.user_id = u.id AND ur.org_id = u.org_id
LEFT JOIN core.roles r ON r.id = ur.role_id
LEFT JOIN core.role_permissions rp ON rp.role_id = r.id
LEFT JOIN core.permissions p ON p.id = rp.permission_id
WHERE ur.expires_at IS NULL OR ur.expires_at > NOW()
GROUP BY u.id, u.org_id, u.email, u.full_name;

-- Installed plugins with status
CREATE OR REPLACE VIEW core.v_org_plugins AS
SELECT 
  pi.org_id,
  p.id AS plugin_id,
  p.name,
  p.description,
  pi.state,
  pi.version AS installed_version,
  p.version AS latest_version,
  pi.installed_at,
  pi.enabled_at,
  p.nav_items,
  p.permissions AS declared_permissions
FROM core.plugin_installations pi
JOIN core.plugins p ON p.id = pi.plugin_id;
