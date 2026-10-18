import type { SupabaseClient } from "@supabase/supabase-js";
import { invokeFunction } from "@/lib/api";
import { EdgeFunction } from "@/types/edge-functions";

export async function registerPushSubscription(
  client: SupabaseClient,
  subscription: { endpoint: string; p256dh: string; authKey: string },
) {
  return invokeFunction<{ registered: true }>(client, {
    functionName: EdgeFunction.registerPushSubscription,
    method: "POST",
    requireSession: true,
    body: subscription,
  });
}
