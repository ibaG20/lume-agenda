import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, invokeFunction, newRequestId, ok, toApiError } from "@/lib/api";
import type { ApiResult } from "@/types/api";
import { EdgeFunction } from "@/types/edge-functions";
import type {
  AvailabilityRuleDto,
  CreateRuleInput,
  UpdateRuleInput,
} from "../types";
import { isDayOfWeek } from "./day-of-week";

const requireSession = true;

function toRuleDto(data: AvailabilityRuleDto): AvailabilityRuleDto {
  const slotDurationMinutes = data.slotDurationMinutes ?? 60;
  const startMinutes =
    Number(data.startTime.slice(0, 2)) * 60 +
    Number(data.startTime.slice(3, 5));
  const endMinutes =
    Number(data.endTime.slice(0, 2)) * 60 + Number(data.endTime.slice(3, 5));
  return {
    id: data.id,
    groupId: data.groupId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    slotDurationMinutes,
    appointmentCount:
      data.appointmentCount ??
      Math.max(
        1,
        Math.floor((endMinutes - startMinutes) / slotDurationMinutes),
      ),
  };
}

function invalidDayOfWeek(): ApiResult<AvailabilityRuleDto> {
  return fail(
    toApiError({
      code: "VALIDATION",
      requestId: newRequestId(),
    }),
  );
}

export async function listRules(
  client: SupabaseClient,
  groupId: string,
): Promise<ApiResult<AvailabilityRuleDto[]>> {
  const result = await invokeFunction<AvailabilityRuleDto[]>(client, {
    functionName: EdgeFunction.listRules,
    method: "GET",
    body: { groupId },
    requireSession,
  });

  if (!result.ok) {
    return result;
  }

  return ok(result.data.map(toRuleDto), result.requestId);
}

export async function createRule(
  client: SupabaseClient,
  input: CreateRuleInput,
): Promise<ApiResult<AvailabilityRuleDto>> {
  if (!isDayOfWeek(input.dayOfWeek)) {
    return invalidDayOfWeek();
  }

  const result = await invokeFunction<AvailabilityRuleDto>(client, {
    functionName: EdgeFunction.createRule,
    method: "POST",
    body: {
      groupId: input.groupId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
    },
    requireSession,
  });

  if (!result.ok) {
    return result;
  }

  return ok(toRuleDto(result.data), result.requestId);
}

export async function updateRule(
  client: SupabaseClient,
  input: UpdateRuleInput,
): Promise<ApiResult<AvailabilityRuleDto>> {
  if (input.dayOfWeek !== undefined && !isDayOfWeek(input.dayOfWeek)) {
    return invalidDayOfWeek();
  }

  const body: Record<string, unknown> = { id: input.id };
  if (input.dayOfWeek !== undefined) {
    body.dayOfWeek = input.dayOfWeek;
  }
  if (input.startTime !== undefined) {
    body.startTime = input.startTime;
  }
  if (input.endTime !== undefined) {
    body.endTime = input.endTime;
  }

  const result = await invokeFunction<AvailabilityRuleDto>(client, {
    functionName: EdgeFunction.updateRule,
    method: "PATCH",
    body,
    requireSession,
  });

  if (!result.ok) {
    return result;
  }

  return ok(toRuleDto(result.data), result.requestId);
}

export async function deleteRule(
  client: SupabaseClient,
  id: string,
): Promise<ApiResult<{ id: string }>> {
  const result = await invokeFunction<{ id: string }>(client, {
    functionName: EdgeFunction.deleteRule,
    method: "POST",
    body: { id },
    requireSession,
  });

  if (!result.ok) {
    return result;
  }

  return ok({ id: result.data.id }, result.requestId);
}
