"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Badge, Skeleton } from "@/components/ui";
import { usePlugins, useAvailablePlugins, useInstallPlugin, usePluginState } from "@/lib/plugins/hooks";
import { PermissionGate } from "@/lib/rbac/hooks";
import { CORE_PERMISSIONS } from "@/lib/rbac/permissions";
import { Puzzle, Download, Check, Play, Pause } from "lucide-react";

export default function PluginsPage() {
  const { plugins: installedPlugins, loading: installedLoading, refresh } = usePlugins();
  const { plugins: availablePlugins, loading: availableLoading } = useAvailablePlugins();
  const { install, loading: installing } = useInstallPlugin();
  const { enable, disable, loading: toggling } = usePluginState();
  const [activeTab, setActiveTab] = useState<"installed" | "available">("installed");

  const handleInstall = async (pluginId: string) => {
    const success = await install(pluginId);
    if (success) {
      await refresh();
    }
  };

  const handleToggle = async (pluginId: string, currentState: string) => {
    if (currentState === "enabled") {
      await disable(pluginId);
    } else {
      await enable(pluginId);
    }
    await refresh();
  };

  // Get available plugins that aren't installed
  const installedIds = installedPlugins.map((p) => p.plugin_id);
  const notInstalledPlugins = availablePlugins.filter(
    (p) => !installedIds.includes(p.plugin_id)
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h2 flex items-center gap-3">
            <Puzzle className="w-8 h-8" />
            Plugins
          </h1>
          <p className="text-[var(--color-text-secondary)] body">
            Extend your platform with powerful plugins
          </p>
        </div>
        <Badge variant="info">{installedPlugins.length} installed</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-bg-warm)] pb-4">
        <button
          onClick={() => setActiveTab("installed")}
          className={`px-4 py-2 rounded-full transition-all ${
            activeTab === "installed"
              ? "bg-[var(--color-primary)] text-[var(--color-dark)] font-semibold"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)]"
          }`}
        >
          Installed ({installedPlugins.length})
        </button>
        <PermissionGate permission={CORE_PERMISSIONS.PLUGINS_INSTALL}>
          <button
            onClick={() => setActiveTab("available")}
            className={`px-4 py-2 rounded-full transition-all ${
              activeTab === "available"
                ? "bg-[var(--color-primary)] text-[var(--color-dark)] font-semibold"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)]"
            }`}
          >
            Available ({notInstalledPlugins.length})
          </button>
        </PermissionGate>
      </div>

      {/* Installed Plugins */}
      {activeTab === "installed" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {installedLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
          ) : installedPlugins.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Puzzle className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-muted)]" />
                <p className="h4 mb-2">No plugins installed</p>
                <p className="body-sm text-[var(--color-text-muted)]">
                  Browse available plugins to extend your platform
                </p>
              </CardContent>
            </Card>
          ) : (
            installedPlugins.map((plugin) => (
              <Card key={plugin.plugin_id} hover>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-10)] flex items-center justify-center">
                      <Puzzle className="w-6 h-6 text-[var(--color-primary-hover)]" />
                    </div>
                    <Badge
                      variant={plugin.state === "enabled" ? "success" : "default"}
                    >
                      {plugin.state}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{plugin.name}</CardTitle>
                  <CardDescription>
                    v{plugin.installed_version}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <PermissionGate permission={CORE_PERMISSIONS.PLUGINS_MANAGE}>
                    <div className="flex gap-2 w-full">
                      <Button
                        variant={plugin.state === "enabled" ? "secondary" : "primary"}
                        size="sm"
                        className="flex-1"
                        icon={plugin.state === "enabled" ? Pause : Play}
                        onClick={() => handleToggle(plugin.plugin_id, plugin.state || "")}
                        isLoading={toggling}
                      >
                        {plugin.state === "enabled" ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </PermissionGate>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Available Plugins */}
      {activeTab === "available" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))
          ) : notInstalledPlugins.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Check className="w-16 h-16 mx-auto mb-4 text-[#22C55E]" />
                <p className="h4 mb-2">All plugins installed!</p>
                <p className="body-sm text-[var(--color-text-muted)]">
                  You have installed all available plugins
                </p>
              </CardContent>
            </Card>
          ) : (
            notInstalledPlugins.map((plugin) => (
              <Card key={plugin.plugin_id} hover>
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-warm)] flex items-center justify-center">
                    <Puzzle className="w-6 h-6 text-[var(--color-text-muted)]" />
                  </div>
                  <CardTitle className="mt-4">{plugin.name}</CardTitle>
                  <CardDescription>
                    {plugin.description || `v${plugin.latest_version}`}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    icon={Download}
                    onClick={() => handleInstall(plugin.plugin_id)}
                    isLoading={installing}
                  >
                    Install
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
