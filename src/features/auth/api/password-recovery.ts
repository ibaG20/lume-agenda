import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiResult } from "@/types/api";
import { fail, newRequestId, ok, toApiError } from "@/lib/api";

export const PASSWORD_RESET_REQUEST_ERROR_MESSAGE =
  "Não foi possível enviar o e-mail agora. Aguarde um momento e tente novamente.";
export const PASSWORD_UPDATE_ERROR_MESSAGE =
  "Não foi possível atualizar a senha. Solicite um novo link e tente novamente.";

type PasswordResetRequest = {
  email: string;
  redirectTo: string;
};

function isUnavailable(error: { status?: number }): boolean {
  return error.status === 429 || Boolean(error.status && error.status >= 500);
}

export async function requestPasswordReset(
  client: SupabaseClient,
  input: PasswordResetRequest,
): Promise<ApiResult<{ requested: true }>> {
  const { error } = await client.auth.resetPasswordForEmail(input.email, {
    redirectTo: input.redirectTo,
  });

  if (error) {
    return fail(
      toApiError({
        code: isUnavailable(error) ? "UNAVAILABLE" : "VALIDATION",
        message: PASSWORD_RESET_REQUEST_ERROR_MESSAGE,
        requestId: newRequestId(),
        status: isUnavailable(error) ? 503 : 400,
      }),
    );
  }

  return ok({ requested: true }, newRequestId());
}

export async function updatePassword(
  client: SupabaseClient,
  password: string,
): Promise<ApiResult<{ updated: true }>> {
  const { data, error } = await client.auth.updateUser({ password });

  if (error || !data.user) {
    return fail(
      toApiError({
        code: error && isUnavailable(error) ? "UNAVAILABLE" : "VALIDATION",
        message: PASSWORD_UPDATE_ERROR_MESSAGE,
        requestId: newRequestId(),
        status: error && isUnavailable(error) ? 503 : 400,
      }),
    );
  }

  return ok({ updated: true }, newRequestId());
}
