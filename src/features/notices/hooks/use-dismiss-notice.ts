"use client";

import { useAsyncAction } from "@/hooks/use-async-action";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { dismissNotice } from "../api/dismiss-notice";

export function useDismissNotice(onDismissed?: () => void) {
  const action = useAsyncAction(
    (noticeId: string) =>
      dismissNotice(createBrowserSupabaseClient(), noticeId),
    { successMessage: "Aviso dispensado." },
  );

  return {
    status: action.status,
    error: action.error,
    dismiss: async (noticeId: string) => {
      const result = await action.run(noticeId);
      if (result.ok) onDismissed?.();
      return result;
    },
  };
}
