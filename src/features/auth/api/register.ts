import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiResult } from "@/types/api";
import { fail, newRequestId, ok, toApiError } from "@/lib/api";
import type { RegistrationCredentials, RegistrationResult } from "../types";

export const REGISTER_ERROR_MESSAGE =
  "Não foi possível criar a conta. Revise os dados e tente novamente.";
export const REGISTER_RATE_LIMIT_MESSAGE =
  "O limite temporário de envio de e-mails foi atingido. Aguarde e tente novamente.";

function isRateLimitError(error: { code?: string; status?: number }): boolean {
  return (
    error.status === 429 ||
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit"
  );
}

export async function registerWithPassword(
  client: SupabaseClient,
  credentials: RegistrationCredentials,
  options: { emailRedirectTo: string },
): Promise<ApiResult<RegistrationResult>> {
  const { data, error } = await client.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: options.emailRedirectTo,
    },
  });

  if (error) {
    const rateLimited = isRateLimitError(error);
    return fail(
      toApiError({
        code: rateLimited
          ? "UNAVAILABLE"
          : error.status && error.status >= 500
            ? "UNAVAILABLE"
            : "VALIDATION",
        message: rateLimited
          ? REGISTER_RATE_LIMIT_MESSAGE
          : REGISTER_ERROR_MESSAGE,
        requestId: newRequestId(),
      }),
    );
  }

  if (data.session) {
    return ok(
      { status: "authenticated", session: data.session },
      newRequestId(),
    );
  }

  if (data.user) {
    return ok(
      { status: "confirmation_required", session: null },
      newRequestId(),
    );
  }

  return fail(
    toApiError({
      code: "INTERNAL",
      message: REGISTER_ERROR_MESSAGE,
      requestId: newRequestId(),
    }),
  );
}
