import type { SupabaseClient } from "@supabase/supabase-js";
import { getNotificationConfig } from "./api/notification-config";
import { registerPushSubscription } from "./api/register-push-subscription";

function urlBase64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replaceAll("-", "+").replaceAll("_", "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes;
}

export async function enableMobileNotifications(
  client: SupabaseClient,
): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return permission;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return permission;
  const config = await getNotificationConfig(client);
  if (!config.ok || !config.data.vapidPublicKey) return permission;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToBytes(config.data.vapidPublicKey),
  });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return permission;
  await registerPushSubscription(client, {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    authKey: json.keys.auth,
  });
  return permission;
}
