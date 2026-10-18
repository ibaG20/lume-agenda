"use client";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getDailyAgenda } from "../api/get-daily-agenda";

export function useDailyAgenda(date: string) {
  return useAsyncResource(
    () => getDailyAgenda(createBrowserSupabaseClient(), date),
    date,
    {
      enabled: date.length > 0,
      isEmpty: (data) => data.slots.length === 0,
      cacheKey: date.length > 0 ? `agenda:${date}` : undefined,
      cacheTtlMs: 6 * 60 * 60 * 1000,
    },
  );
}
