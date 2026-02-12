"use client";

import { Card, CardHeader, CardTitle, CardContent, Badge, Progress } from "@/components/ui";
import { useRBAC } from "@/lib/rbac/provider";
import { usePlugins } from "@/lib/plugins/hooks";
import { LayoutDashboard, Users, Puzzle, Activity, TrendingUp, Clock } from "lucide-react";

export default function DashboardPage() {
  const { profile, organization, roles, loading: rbacLoading } = useRBAC();
  const { plugins, loading: pluginsLoading } = usePlugins();

  const enabledPlugins = plugins.filter((p) => p.state === "enabled").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="h2">Dashboard</h1>
        <p className="text-[var(--color-text-secondary)] body">
          Welcome back, {profile?.full_name || profile?.email || "User"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-10)] flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-[var(--color-primary-hover)]" />
            </div>
            <div>
              <p className="micro text-[var(--color-text-muted)] uppercase tracking-wide">Organization</p>
              <p className="h4">{organization?.name || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(34,197,94,0.1)] flex items-center justify-center">
              <Users className="w-6 h-6 text-[#22C55E]" />
            </div>
            <div>
              <p className="micro text-[var(--color-text-muted)] uppercase tracking-wide">Your Role</p>
              <p className="h4 capitalize">{roles[0] || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
              <Puzzle className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <div>
              <p className="micro text-[var(--color-text-muted)] uppercase tracking-wide">Plugins</p>
              <p className="h4">{enabledPlugins} enabled</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(245,158,11,0.1)] flex items-center justify-center">
              <Activity className="w-6 h-6 text-[var(--color-primary-hover)]" />
            </div>
            <div>
              <p className="micro text-[var(--color-text-muted)] uppercase tracking-wide">Status</p>
              <p className="h4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                Active
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="body-sm text-[var(--color-text-secondary)]">Platform Setup</span>
                <span className="body-sm font-semibold">75%</span>
              </div>
              <Progress value={75} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="body-sm text-[var(--color-text-secondary)]">Plugin Usage</span>
                <span className="body-sm font-semibold">{enabledPlugins}/{plugins.length}</span>
              </div>
              <Progress value={plugins.length > 0 ? (enabledPlugins / plugins.length) * 100 : 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Platform initialized", time: "Just now", badge: "success" as const },
                { action: "Organization created", time: "Just now", badge: "info" as const },
                { action: "User profile set up", time: "Just now", badge: "success" as const },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-bg-warm)] last:border-0">
                  <span className="body-sm">{item.action}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.badge}>{item.time}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
