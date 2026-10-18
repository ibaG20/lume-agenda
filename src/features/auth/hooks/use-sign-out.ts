"use client";

import { useAsyncAction } from "@/hooks/use-async-action";
import { clearReadCache } from "@/hooks/use-async-resource";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { signOut } from "../api/sign-out";

export function useSignOut() {
  const action = useAsyncAction(() => signOut(createBrowserSupabaseClient()), {
    errorToast: true,
  });

  return {
    status: action.status,
    error: action.error,
    signOut: async () => {
      const result = await action.run(undefined);
      if (result.ok) clearReadCache();
      return result;
    },
  };
}
