"use client";

import { useState } from "react";
import { Navbar, Sidebar } from "@/components/layout";
import { RBACProvider } from "@/lib/rbac/provider";
import { RedirectGuard } from "@/lib/auth/guards";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RedirectGuard>
      <RBACProvider>
        <div className="min-h-screen bg-[var(--color-bg)]">
          <Navbar
            title="NIXITO"
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            isMenuOpen={sidebarOpen}
          />
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="pt-16 lg:pl-64">
            <div className="container page">{children}</div>
          </main>
        </div>
      </RBACProvider>
    </RedirectGuard>
  );
}
