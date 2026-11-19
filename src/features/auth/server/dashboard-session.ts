import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile, type ProfileDto } from "@/features/profile";
import { hasPublicEnv } from "@/lib/env/public";
import {
  FIRST_ACCESS_GUIDE_COOKIE,
  FIRST_ACCESS_GUIDE_METADATA_KEY,
  PROFILE_COMPLETION_PATH,
} from "@/lib/first-access-guide";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const requireDashboardUser = cache(async () => {
  if (!hasPublicEnv()) redirect("/sign-in?next=%2Finicio");

  const client = await createServerSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect("/sign-in?next=%2Finicio");

  return {
    client,
    id: data.user.id,
    email: data.user.email ?? "",
    guideCompletedOnAccount: Boolean(
      data.user.user_metadata?.[FIRST_ACCESS_GUIDE_METADATA_KEY],
    ),
  };
});

export const getDashboardProfile = cache(async () => {
  const { client } = await requireDashboardUser();
  return getProfile(client);
});

/** `true` quando o perfil não existe ou não tem os dados obrigatórios. */
export const isProfileIncomplete = cache(async () => {
  const result = await getDashboardProfile();
  if (!result.ok) return result.error.code === "NOT_FOUND";
  return !result.data.phone;
});

/**
 * Conclusão do guia: registrada na conta ou, logo após concluir (antes de a
 * conta ser atualizada), no cookie deste navegador.
 */
export const hasCompletedFirstAccessGuide = cache(async () => {
  const { id, guideCompletedOnAccount } = await requireDashboardUser();
  if (guideCompletedOnAccount) return true;
  const cookieStore = await cookies();
  return cookieStore.get(FIRST_ACCESS_GUIDE_COOKIE)?.value === id;
});

/**
 * Exige o perfil completo. A exceção é o primeiro acesso: enquanto o guia
 * não foi concluído, as telas são liberadas e o retorno é `null`; o próprio
 * guia leva o usuário ao perfil quando termina.
 */
export const requireCompleteProfile = cache(
  async (): Promise<ProfileDto | null> => {
    const result = await getDashboardProfile();
    if (!result.ok && result.error.code !== "NOT_FOUND") {
      throw new Error(result.error.message);
    }
    if (result.ok && result.data.phone) return result.data;
    if (!(await hasCompletedFirstAccessGuide())) return null;
    redirect(PROFILE_COMPLETION_PATH);
  },
);
