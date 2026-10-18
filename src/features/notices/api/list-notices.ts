import type { SupabaseClient } from "@supabase/supabase-js";
import { invokeFunction, ok } from "@/lib/api";
import type { ApiResult } from "@/types/api";
import { EdgeFunction } from "@/types/edge-functions";
import type { NoticeListDto } from "../types";
import { toNoticeListDto } from "./to-notice-list-dto";

export async function listNotices(
  client: SupabaseClient,
): Promise<ApiResult<NoticeListDto>> {
  const result = await invokeFunction<NoticeListDto>(client, {
    functionName: EdgeFunction.listNotices,
    method: "GET",
    requireSession: true,
  });
  if (!result.ok) return result;
  return ok(toNoticeListDto(result.data), result.requestId);
}
