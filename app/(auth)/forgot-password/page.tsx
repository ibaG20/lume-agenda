import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordScreen } from "@/features/auth";
import { hasPublicEnv } from "@/lib/env/public";
import { hasAuthenticatedSession } from "../session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recuperar senha · Agendinha",
  description: "Receba por e-mail um link para criar uma nova senha.",
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const query = await searchParams;

  if (await hasAuthenticatedSession()) redirect("/");

  return (
    <ForgotPasswordScreen
      configured={hasPublicEnv()}
      initialError={typeof query.error === "string" ? query.error : undefined}
    />
  );
}
