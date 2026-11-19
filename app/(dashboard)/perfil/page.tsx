import type { Metadata } from "next";
import { ProfileScreen } from "@/features/dashboard/components/profile-screen";
import {
  getDashboardProfile,
  requireDashboardUser,
} from "@/features/auth/server/dashboard-session";

export const metadata: Metadata = {
  title: "Perfil · Agendinha",
};

type PerfilPageProps = {
  searchParams: Promise<{ "primeiro-acesso"?: string | string[] }>;
};

export default async function PerfilPage({ searchParams }: PerfilPageProps) {
  const query = await searchParams;
  const { email } = await requireDashboardUser();
  const profile = await getDashboardProfile();
  if (!profile.ok && profile.error.code !== "NOT_FOUND") {
    throw new Error(profile.error.message);
  }

  return (
    <ProfileScreen
      email={email}
      firstAccess={query["primeiro-acesso"] === "1" || !profile.ok}
      initialProfile={profile.ok ? profile.data : undefined}
    />
  );
}
