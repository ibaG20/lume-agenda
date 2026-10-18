import type { SupabaseClient } from "@supabase/supabase-js";
import { invokeFunction } from "@/lib/api";
import { EdgeFunction } from "@/types/edge-functions";

export async function getNotificationConfig(client: SupabaseClient) {
  return invokeFunction<{ vapidPublicKey: string | null }>(client, {
    functionName: EdgeFunction.getNotificationConfig,
    method: "GET",
    requireSession: true,
  });
}
