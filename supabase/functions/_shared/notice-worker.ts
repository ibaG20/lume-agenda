import { dbError } from "./http.ts";
import type { RequestContext } from "./types.ts";

type NoticeRow = {
  id: string;
  provider_id: string;
  appointment_id: string;
  event_type: "CLIENT_BOOKED" | "CLIENT_CANCELLED";
};

type PushSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
};

type PushResult = "SENT" | "SKIPPED" | "FAILED";

function formatWhen(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(iso));
}

async function complete(
  context: RequestContext,
  id: string,
  result: PushResult,
) {
  const completed = await context.admin.rpc("complete_notice_push", {
    p_id: id,
    p_result: result,
  });
  if (completed.error) dbError(completed.error);
}

async function sendPush(
  subscription: PushSubscription,
  payload: string,
): Promise<"sent" | "gone" | "failed"> {
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")?.trim();
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")?.trim();
  const subject = Deno.env.get("VAPID_SUBJECT")?.trim() ||
    "mailto:agendas@agendinha.app";
  if (!publicKey || !privateKey) return "failed";

  try {
    const imported = await import("npm:web-push@3.6.7");
    const webpush = imported.default ?? imported;
    webpush.setVapidDetails(subject, publicKey, privateKey);
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
      },
      payload,
    );
    return "sent";
  } catch (error) {
    const statusCode = typeof error === "object" && error !== null &&
        "statusCode" in error
      ? Number(error.statusCode)
      : 0;
    if (statusCode === 404 || statusCode === 410) return "gone";
    return "failed";
  }
}

async function deliverNotice(
  context: RequestContext,
  notice: NoticeRow,
): Promise<PushResult> {
  const [appointment, profile, subscriptions] = await Promise.all([
    context.admin
      .from("Appointment")
      .select("client_id,start_datetime")
      .eq("id", notice.appointment_id)
      .eq("provider_id", notice.provider_id)
      .maybeSingle(),
    context.admin
      .from("profiles")
      .select("timezone")
      .eq("id", notice.provider_id)
      .maybeSingle(),
    context.admin
      .from("push_subscription")
      .select("id,endpoint,p256dh,auth_key")
      .eq("provider_id", notice.provider_id),
  ]);
  if (appointment.error || profile.error || subscriptions.error) {
    return "FAILED";
  }
  const targets = (subscriptions.data ?? []) as PushSubscription[];
  if (!Deno.env.get("VAPID_PUBLIC_KEY")?.trim() || targets.length === 0) {
    return "SKIPPED";
  }

  const timezone = profile.data?.timezone ?? "America/Sao_Paulo";
  let clientName = "Um cliente";
  if (appointment.data?.client_id) {
    const client = await context.admin
      .from("ProviderClient")
      .select("name")
      .eq("provider_id", notice.provider_id)
      .eq("client_id", appointment.data.client_id)
      .maybeSingle();
    if (!client.error && client.data?.name) clientName = client.data.name;
  }
  const when = appointment.data
    ? formatWhen(appointment.data.start_datetime, timezone)
    : "um horário";
  const booked = notice.event_type === "CLIENT_BOOKED";
  const payload = JSON.stringify({
    title: booked ? "Novo agendamento" : "Horário cancelado",
    body: `${clientName} ${
      booked ? "agendou" : "cancelou"
    } o horário de ${when}.`,
    tag: notice.id,
    url: "/inicio",
  });

  let sent = 0;
  let failed = 0;
  for (const subscription of targets) {
    const result = await sendPush(subscription, payload);
    if (result === "sent") sent += 1;
    if (result === "gone") {
      await context.admin.from("push_subscription").delete().eq(
        "id",
        subscription.id,
      );
    }
    if (result === "failed") failed += 1;
  }
  if (sent > 0) return "SENT";
  if (failed > 0) return "FAILED";
  return "SKIPPED";
}

export async function processNoticeOutbox(context: RequestContext) {
  const limit = Math.max(
    1,
    Math.min(Number(context.input.limit ?? 20) || 20, 100),
  );
  const claimed = await context.admin.rpc("claim_notice_push", {
    p_limit: limit,
  });
  if (claimed.error) dbError(claimed.error);
  const rows = (claimed.data ?? []) as NoticeRow[];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    let result: PushResult = "FAILED";
    try {
      result = await deliverNotice(context, row);
    } catch {
      result = "FAILED";
    }
    await complete(context, row.id, result);
    if (result === "SENT") sent += 1;
    else if (result === "SKIPPED") skipped += 1;
    else failed += 1;
  }

  return { claimed: rows.length, sent, skipped, failed };
}
