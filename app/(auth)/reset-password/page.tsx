import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordScreen } from "@/features/auth";
import { hasPublicEnv } from "@/lib/env/public";
import { hasAuthenticatedSession } from "../session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Criar nova senha · Agendinha",
  description: "Crie uma nova senha para recuperar o acesso à sua conta.",
};

export default async function ResetPasswordPage() {
  const configured = hasPublicEnv();

  if (configured && !(await hasAuthenticatedSession())) {
    redirect("/forgot-password?error=invalid_link");
  }

  return <ResetPasswordScreen configured={configured} />;
}
