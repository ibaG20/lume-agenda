import { dbError } from "./http.ts";
import { ApiError, type RequestContext } from "./types.ts";
import { requiredString, uuid } from "./validation.ts";

function providerId(context: RequestContext): string {
  if (!context.user) {
    throw new ApiError("UNAUTHENTICATED", 401, "Sessão necessária.");
  }
  return context.user.id;
}

type NoticeRow = {
  id: string;
  created_at: string;
  appointment_id: string;
};

export async function listNotices(context: RequestContext) {
  const providerIdValue = providerId(context);
  const notices = await context.admin
    .from("notice_outbox")
    .select("id,created_at,appointment_id")
    .eq("provider_id", providerIdValue)
    .eq("status", "OPEN")
    .eq("event_type", "CLIENT_CANCELLED")
    .order("created_at", { ascending: false })
    .limit(20);
  if (notices.error) dbError(notices.error);

  const rows = (notices.data ?? []) as NoticeRow[];
  if (rows.length === 0) {
    return { timezone: "America/Sao_Paulo", notices: [] };
  }

  const appointmentIds = rows.map((row) => row.appointment_id);
  const appointments = await context.admin
    .from("Appointment")
    .select("id,client_id,start_datetime,end_datetime")
    .eq("provider_id", providerIdValue)
    .in("id", appointmentIds);
  if (appointments.error) dbError(appointments.error);

  const appointmentById = new Map(
    (appointments.data ?? []).map((appointment) => [
      appointment.id,
      appointment,
    ]),
  );
  const clientIds = [
    ...new Set(
      (appointments.data ?? []).map((appointment) => appointment.client_id),
    ),
  ];
  const clients = clientIds.length === 0
    ? { data: [], error: null }
    : await context.admin
      .from("ProviderClient")
      .select("client_id,name")
      .eq("provider_id", providerIdValue)
      .in("client_id", clientIds);
  if (clients.error) dbError(clients.error);
  const nameByClient = new Map(
    (clients.data ?? []).map((client) => [client.client_id, client.name]),
  );
  const profile = await context.admin
    .from("profiles")
    .select("timezone")
    .eq("id", providerIdValue)
    .maybeSingle();
  if (profile.error) dbError(profile.error);

  return {
    timezone: profile.data?.timezone ?? "America/Sao_Paulo",
    notices: rows.flatMap((row) => {
      const appointment = appointmentById.get(row.appointment_id);
      if (!appointment) return [];
      return [{
        id: row.id,
        eventType: "CLIENT_CANCELLED" as const,
        clientName: nameByClient.get(appointment.client_id) ?? "Cliente",
        start: appointment.start_datetime,
        end: appointment.end_datetime,
        createdAt: row.created_at,
      }];
    }),
  };
}

export async function dismissNotice(context: RequestContext) {
  const providerIdValue = providerId(context);
  const noticeId = uuid(context.input, "noticeId");
  const existing = await context.admin
    .from("notice_outbox")
    .select("id,status")
    .eq("id", noticeId)
    .eq("provider_id", providerIdValue)
    .maybeSingle();
  if (existing.error) dbError(existing.error);
  if (!existing.data) {
    throw new ApiError("NOT_FOUND", 404, "Recurso não encontrado.");
  }
  if (existing.data.status === "DISMISSED") {
    return { noticeId, status: "DISMISSED" };
  }

  const updated = await context.admin
    .from("notice_outbox")
    .update({ status: "DISMISSED", dismissed_at: new Date().toISOString() })
    .eq("id", noticeId)
    .eq("provider_id", providerIdValue)
    .eq("status", "OPEN");
  if (updated.error) dbError(updated.error);
  return { noticeId, status: "DISMISSED" };
}

export async function registerPushSubscription(context: RequestContext) {
  const providerIdValue = providerId(context);
  const endpoint = requiredString(context.input, "endpoint", { max: 2000 });
  if (!endpoint.startsWith("https://")) {
    throw new ApiError("VALIDATION", 400, "Revise os dados informados.", {
      endpoint: ["Endereço de notificação inválido."],
    });
  }
  const p256dh = requiredString(context.input, "p256dh", { max: 300 });
  const authKey = requiredString(context.input, "authKey", { max: 300 });
  const saved = await context.admin.from("push_subscription").upsert(
    {
      provider_id: providerIdValue,
      endpoint,
      p256dh,
      auth_key: authKey,
    },
    { onConflict: "provider_id,endpoint" },
  );
  if (saved.error) dbError(saved.error);
  return { registered: true };
}

export function getNotificationConfig() {
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")?.trim() || null;
  return { vapidPublicKey };
}
