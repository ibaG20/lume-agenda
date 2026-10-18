import type { SupabaseClient } from "@supabase/supabase-js";
import { invokeFunction } from "@/lib/api";
import type { ApiResult } from "@/types/api";
import { EdgeFunction } from "@/types/edge-functions";

export async function dismissNotice(
  client: SupabaseClient,
  noticeId: string,
): Promise<ApiResult<{ noticeId: string; status: "DISMISSED" }>> {
  return invokeFunction(client, {
    functionName: EdgeFunction.dismissNotice,
    method: "POST",
    requireSession: true,
    body: { noticeId },
  });
}
