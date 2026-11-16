"use client";

import { useAsyncAction } from "@/hooks/use-async-action";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { requestPasswordReset, updatePassword } from "../api/password-recovery";
import { createAuthCallbackUrl } from "../utils/next-path";

export function usePasswordResetRequest() {
  const request = useAsyncAction((email: string) =>
    requestPasswordReset(createBrowserSupabaseClient(), {
      email,
      redirectTo: createAuthCallbackUrl(
        window.location.origin,
        "/reset-password",
      ),
    }),
  );

  return {
    status: request.status,
    error: request.error,
    data: request.data,
    requestPasswordReset: request.run,
  };
}

export function usePasswordUpdate() {
  const update = useAsyncAction((password: string) =>
    updatePassword(createBrowserSupabaseClient(), password),
  );

  return {
    status: update.status,
    error: update.error,
    data: update.data,
    updatePassword: update.run,
  };
}
