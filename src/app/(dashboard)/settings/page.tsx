"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Toggle, Badge } from "@/components/ui";
import { useRBAC } from "@/lib/rbac/provider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { PermissionGate } from "@/lib/rbac/hooks";
import { CORE_PERMISSIONS } from "@/lib/rbac/permissions";
import { Settings, User, Building2, Shield, Bell, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const { profile, organization, roles, hasPermission, refresh } = useRBAC();
  const [activeTab, setActiveTab] = useState<"profile" | "organization" | "security">("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [notifications, setNotifications] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (profile) setFullName(profile.full_name || "");
    if (organization) setOrgName(organization.name);
  }, [profile, organization]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    
    await supabase
      .from("users")
      .update({ full_name: fullName })
      .eq("id", profile.id);
    
    await refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveOrg = async () => {
    if (!organization) return;
    setSaving(true);
    
    await supabase
      .from("organizations")
      .update({ name: orgName })
      .eq("id", organization.id);
    
    await refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs: Array<{ id: "profile" | "organization" | "security"; label: string; icon: typeof User; permission?: string }> = [
    { id: "profile", label: "Profile", icon: User },
    { id: "organization", label: "Organization", icon: Building2, permission: CORE_PERMISSIONS.ORG_UPDATE },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="h2 flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-[var(--color-text-secondary)] body">
          Manage your account and organization preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-bg-warm)] pb-4">
        {tabs.map((tab) => {
          if (tab.permission && !hasPermission(tab.permission)) return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-[var(--color-dark)] font-semibold"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={profile?.email || ""}
              disabled
            />
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
            <div className="flex items-center justify-between">
              <div>
                <p className="body font-medium">Email Notifications</p>
                <p className="body-sm text-[var(--color-text-muted)]">
                  Receive email updates about your account
                </p>
              </div>
              <Toggle checked={notifications} onChange={setNotifications} />
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                isLoading={saving}
                icon={saved ? Check : Save}
              >
                {saved ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Tab */}
      {activeTab === "organization" && (
        <PermissionGate permission={CORE_PERMISSIONS.ORG_UPDATE}>
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Manage your organization&apos;s details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Organization Name"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <Input
                label="URL Slug"
                type="text"
                value={organization?.slug || ""}
                disabled
              />
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleSaveOrg}
                  isLoading={saving}
                  icon={saved ? Check : Save}
                >
                  {saved ? "Saved!" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </PermissionGate>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-[var(--color-bg-warm)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="body font-medium">Your Roles</p>
                  <p className="body-sm text-[var(--color-text-muted)]">
                    Permissions assigned to your account
                  </p>
                </div>
                <div className="flex gap-2">
                  {roles.map((role) => (
                    <Badge key={role} variant="info">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-bg-warm)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="body font-medium">Two-Factor Authentication</p>
                  <p className="body-sm text-[var(--color-text-muted)]">
                    Add an extra layer of security
                  </p>
                </div>
                <Badge variant="warning">Coming Soon</Badge>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--color-bg-warm)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="body font-medium">Active Sessions</p>
                  <p className="body-sm text-[var(--color-text-muted)]">
                    Manage your active login sessions
                  </p>
                </div>
                <Badge variant="success">1 active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
