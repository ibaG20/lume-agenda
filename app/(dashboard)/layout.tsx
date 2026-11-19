import { DashboardShell } from "@/components/organisms/dashboard-shell";
import {
  hasCompletedFirstAccessGuide,
  isProfileIncomplete,
  requireDashboardUser,
} from "@/features/auth/server/dashboard-session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const { id } = await requireDashboardUser();
  const [profileIncomplete, guideCompleted] = await Promise.all([
    isProfileIncomplete(),
    hasCompletedFirstAccessGuide(),
  ]);
  return (
    <DashboardShell
      guideCompleted={guideCompleted}
      profileIncomplete={profileIncomplete}
      userId={id}
    >
      {children}
    </DashboardShell>
  );
}
