import type { SupabaseClient } from "@supabase/supabase-js";
import { getNotificationConfig } from "./api/notification-config";
import { registerPushSubscription } from "./api/register-push-subscription";

export type MobileNotificationStatus =
  NotificationPermission | "enabled" | "unsupported";

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

function sameApplicationServerKey(
  current: BufferSource | null,
  expected: Uint8Array<ArrayBuffer>,
): boolean {
  if (!current) return false;
  const bytes = ArrayBuffer.isView(current)
    ? new Uint8Array(current.buffer, current.byteOffset, current.byteLength)
    : new Uint8Array(current);
  return (
    bytes.length === expected.length &&
    bytes.every((byte, index) => byte === expected[index])
  );
}

function supportsPushNotifications() {
  return (
    typeof Notification !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function getMobileNotificationStatus(): Promise<MobileNotificationStatus> {
  if (!supportsPushNotifications()) return "unsupported";
  if (Notification.permission !== "granted") return Notification.permission;

  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) return "granted";
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "enabled" : "granted";
}

export async function enableMobileNotifications(
  client: SupabaseClient,
): Promise<MobileNotificationStatus> {
  if (!supportsPushNotifications()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  const registration = await navigator.serviceWorker.ready;
  const config = await getNotificationConfig(client);
  if (!config.ok) throw new Error(config.error.message);
  if (!config.data.vapidPublicKey) {
    throw new Error(
      "As notificações ainda não estão configuradas no servidor.",
    );
  }

  const applicationServerKey = urlBase64ToBytes(config.data.vapidPublicKey);
  let subscription = await registration.pushManager.getSubscription();
  if (
    subscription &&
    !sameApplicationServerKey(
      subscription.options.applicationServerKey,
      applicationServerKey,
    )
  ) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ??= await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("O navegador não retornou uma inscrição válida.");
  }
  const registered = await registerPushSubscription(client, {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    authKey: json.keys.auth,
  });
  if (!registered.ok) throw new Error(registered.error.message);
  return "enabled";
}
