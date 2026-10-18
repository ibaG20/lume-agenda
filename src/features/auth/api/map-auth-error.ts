import type { AuthError } from "@supabase/supabase-js";
import type { ApiResult } from "@/types/api";
import {
  DEFAULT_ERROR_MESSAGES,
  fail,
  newRequestId,
  toApiError,
} from "@/lib/api";

export const AUTH_ERROR_MESSAGE = "Não foi possível autenticar.";

function isReachabilityError(error: AuthError) {
  return (
    error.name === "AuthRetryableFetchError" ||
    error.status === 0 ||
    error.status === 503 ||
    error.status === 504
  );
}

export function mapAuthError<T = never>(error: AuthError): ApiResult<T> {
  if (isReachabilityError(error)) {
    return fail(
      toApiError({
        code: "UNAVAILABLE",
        message: DEFAULT_ERROR_MESSAGES.UNAVAILABLE,
        requestId: newRequestId(),
        status: 503,
      }),
    );
  }

  const status = error.status === 422 || error.status === 400 ? 400 : 401;
  return fail(
    toApiError({
      code: status === 400 ? "VALIDATION" : "UNAUTHENTICATED",
      message: AUTH_ERROR_MESSAGE,
      requestId: newRequestId(),
      status,
    }),
  );
}
