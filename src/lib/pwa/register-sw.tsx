"use client";

import { useEffect } from "react";

const APP_CACHE_PREFIX = "agendinha-";

async function clearDevelopmentPwaState() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => {
        const worker =
          registration.active ??
          registration.waiting ??
          registration.installing;
        return worker?.scriptURL
          ? new URL(worker.scriptURL).pathname === "/sw.js"
          : false;
      })
      .map((registration) => registration.unregister()),
  );

  if (!("caches" in window)) return;
  const cacheNames = await window.caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => name.startsWith(APP_CACHE_PREFIX))
      .map((name) => window.caches.delete(name)),
  );
}

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void clearDevelopmentPwaState().catch(() => undefined);
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => undefined);
  }, []);

  return null;
}
