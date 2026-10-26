import { DashboardShell } from "@/components/organisms/dashboard-shell";
import { requireDashboardUser } from "@/features/auth/server/dashboard-session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const { id } = await requireDashboardUser();
  return <DashboardShell userId={id}>{children}</DashboardShell>;
}
