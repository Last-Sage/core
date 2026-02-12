import DashboardShell from "./dashboard-shell";

// Dashboard pages require Supabase client (browser environment)
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
