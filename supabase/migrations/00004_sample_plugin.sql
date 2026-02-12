-- ============================================
-- SAMPLE PLUGIN: Notes
-- Migration: 00004_sample_plugin.sql
-- Demonstrates plugin schema pattern
-- ============================================

-- Create plugin schema
CREATE SCHEMA IF NOT EXISTS plugin_notes;

-- ============================================
-- REGISTER PLUGIN
-- ============================================
INSERT INTO core.plugins (id, name, description, version, author, permissions, nav_items, is_active)
VALUES (
  'notes',
  'Notes',
  'Simple note-taking plugin with folders and tags',
  '1.0.0',
  'NIXITO Core Team',
  '["notes:read", "notes:write", "notes:delete"]'::JSONB,
  '[{"label": "Notes", "href": "/notes", "icon": "FileText"}]'::JSONB,
  TRUE
) ON CONFLICT (id) DO UPDATE SET
  version = EXCLUDED.version,
  permissions = EXCLUDED.permissions,
  nav_items = EXCLUDED.nav_items;

-- ============================================
-- REGISTER PLUGIN PERMISSIONS
-- ============================================
INSERT INTO core.permissions (code, name, description, resource, action, is_system)
VALUES 
  ('notes:read', 'View Notes', 'View notes in the organization', 'notes', 'read', FALSE),
  ('notes:write', 'Edit Notes', 'Create and edit notes', 'notes', 'write', FALSE),
  ('notes:delete', 'Delete Notes', 'Delete notes', 'notes', 'delete', FALSE)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- PLUGIN TABLES
-- ============================================

-- Folders for organizing notes
CREATE TABLE plugin_notes.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES plugin_notes.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'folder',
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_folders_org ON plugin_notes.folders(org_id);
CREATE INDEX idx_folders_parent ON plugin_notes.folders(parent_id);

-- Notes
CREATE TABLE plugin_notes.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES plugin_notes.folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  content_html TEXT DEFAULT '',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}', -- Extension fields
  created_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_org ON plugin_notes.notes(org_id);
CREATE INDEX idx_notes_folder ON plugin_notes.notes(folder_id);
CREATE INDEX idx_notes_tags ON plugin_notes.notes USING GIN(tags);
CREATE INDEX idx_notes_metadata ON plugin_notes.notes USING GIN(metadata);
CREATE INDEX idx_notes_search ON plugin_notes.notes USING GIN(to_tsvector('english', title || ' ' || content));

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE plugin_notes.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE plugin_notes.notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: Folders
-- ============================================
CREATE POLICY "folders_select" ON plugin_notes.folders
  FOR SELECT USING (org_id = core.get_user_org_id());

CREATE POLICY "folders_insert" ON plugin_notes.folders
  FOR INSERT WITH CHECK (
    org_id = core.get_user_org_id() 
    AND core.has_permission('notes:write')
  );

CREATE POLICY "folders_update" ON plugin_notes.folders
  FOR UPDATE USING (
    org_id = core.get_user_org_id() 
    AND core.has_permission('notes:write')
  );

CREATE POLICY "folders_delete" ON plugin_notes.folders
  FOR DELETE USING (
    org_id = core.get_user_org_id() 
    AND core.has_permission('notes:delete')
  );

-- ============================================
-- RLS POLICIES: Notes
-- ============================================
CREATE POLICY "notes_select" ON plugin_notes.notes
  FOR SELECT USING (
    org_id = core.get_user_org_id()
    AND core.has_permission('notes:read')
  );

CREATE POLICY "notes_insert" ON plugin_notes.notes
  FOR INSERT WITH CHECK (
    org_id = core.get_user_org_id() 
    AND core.has_permission('notes:write')
  );

CREATE POLICY "notes_update" ON plugin_notes.notes
  FOR UPDATE USING (
    org_id = core.get_user_org_id() 
    AND core.has_permission('notes:write')
  );

CREATE POLICY "notes_delete" ON plugin_notes.notes
  FOR DELETE USING (
    org_id = core.get_user_org_id() 
    AND core.has_permission('notes:delete')
  );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER trg_folders_updated_at
  BEFORE UPDATE ON plugin_notes.folders
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at();

CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON plugin_notes.notes
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at();
