import { Webhook } from "npm:standardwebhooks@1.0.0";
import {
  type AuthHookPayload,
  buildAuthEmailDeliveries,
} from "../_shared/auth-email-templates.ts";
import { LOGO_PNG_BASE64 } from "../_shared/email-logo.ts";
import { LOGO_CONTENT_ID } from "../_shared/email-templates.ts";

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function jsonError(status: number, message: string): Response {
  return Response.json(
    { error: { http_code: status, message } },
    { status },
  );
}

async function sendWithResend(
  delivery: ReturnType<typeof buildAuthEmailDeliveries>[number],
  idempotencyKey: string,
): Promise<void> {
  if ((Deno.env.get("EMAIL_MODE") ?? "resend") === "test") return;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnv("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: requiredEnv("RESEND_FROM"),
      to: [delivery.to],
      subject: delivery.rendered.subject,
      html: delivery.rendered.html,
      text: delivery.rendered.text,
      attachments: [{
        content: LOGO_PNG_BASE64,
        filename: "lume-agendas.png",
        content_type: "image/png",
        content_id: LOGO_CONTENT_ID,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Resend rejected the auth email with status ${response.status}`,
    );
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonError(405, "Method not allowed");
  }

  const body = await request.text();
  let payload: AuthHookPayload;

  try {
    const secret = requiredEnv("SEND_EMAIL_HOOK_SECRET").replace(
      /^v1,whsec_/,
      "",
    );
    payload = new Webhook(secret).verify(
      body,
      Object.fromEntries(request.headers),
    ) as AuthHookPayload;
  } catch {
    return jsonError(401, "Invalid webhook signature");
  }

  try {
    const deliveries = buildAuthEmailDeliveries(
      payload,
      requiredEnv("SUPABASE_URL"),
    );
    const webhookId = request.headers.get("webhook-id") ??
      `${payload.user.id}:${payload.email_data.email_action_type}:${payload.email_data.token_hash}`;

    await Promise.all(
      deliveries.map((delivery, index) =>
        sendWithResend(delivery, `${webhookId}:${index}`)
      ),
    );
    return Response.json({});
  } catch {
    return jsonError(500, "Unable to send authentication email");
  }
});
