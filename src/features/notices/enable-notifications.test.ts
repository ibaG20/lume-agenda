/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  getConfig: vi.fn(),
  registerSubscription: vi.fn(),
}));

vi.mock("./api/notification-config", () => ({
  getNotificationConfig: mocks.getConfig,
}));
vi.mock("./api/register-push-subscription", () => ({
  registerPushSubscription: mocks.registerSubscription,
}));

import {
  enableMobileNotifications,
  getMobileNotificationStatus,
} from "./enable-notifications";

describe("mobile notifications", () => {
  const subscribe = vi.fn();
  const getSubscription = vi.fn();
  const serviceWorkerRegistration = {
    pushManager: { getSubscription, subscribe },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "PushManager", {
      configurable: true,
      value: class PushManager {},
    });
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        permission: "default",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(undefined),
        ready: Promise.resolve(serviceWorkerRegistration),
        register: vi.fn().mockResolvedValue(serviceWorkerRegistration),
      },
    });
    getSubscription.mockResolvedValue(null);
    subscribe.mockResolvedValue({
      options: { applicationServerKey: null },
      toJSON: () => ({
        endpoint: "https://push.example/subscription",
        keys: { p256dh: "public-key", auth: "auth-key" },
      }),
    });
    mocks.getConfig.mockResolvedValue({
      ok: true,
      data: { vapidPublicKey: "AQID" },
    });
    mocks.registerSubscription.mockResolvedValue({
      ok: true,
      data: { registered: true },
    });
  });

  it("reports granted permission without a push subscription as incomplete", async () => {
    Object.defineProperty(window.Notification, "permission", {
      configurable: true,
      value: "granted",
    });

    await expect(getMobileNotificationStatus()).resolves.toBe("granted");
  });

  it("waits for the service worker and saves the browser subscription", async () => {
    await expect(enableMobileNotifications({} as SupabaseClient)).resolves.toBe(
      "enabled",
    );

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    expect(subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array([1, 2, 3]),
    });
    expect(mocks.registerSubscription).toHaveBeenCalledWith(expect.anything(), {
      endpoint: "https://push.example/subscription",
      p256dh: "public-key",
      authKey: "auth-key",
    });
  });

  it("does not report success when the server has no VAPID key", async () => {
    mocks.getConfig.mockResolvedValue({
      ok: true,
      data: { vapidPublicKey: null },
    });

    await expect(
      enableMobileNotifications({} as SupabaseClient),
    ).rejects.toThrow("não estão configuradas");
    expect(mocks.registerSubscription).not.toHaveBeenCalled();
  });
});
