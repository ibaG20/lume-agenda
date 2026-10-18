"use client";

import { useEffect } from "react";
import { useAsyncResource } from "@/hooks/use-async-resource";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { listNotices } from "../api/list-notices";
import type { ProviderNoticeDto } from "../types";

const SEEN_KEY = "lume-notice-seen";

function readSeen(): Set<string> | null {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as unknown;
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((item) => typeof item === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeSeen(ids: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    // Private mode can refuse storage. The in-app list still works.
  }
}

export function showForegroundNotice(
  notice: ProviderNoticeDto,
  timezone: string,
) {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return;
  }
  const when = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(notice.start));
  const booked = notice.eventType === "CLIENT_BOOKED";
  const notification = new Notification(
    booked ? "Novo agendamento" : "Horário cancelado",
    {
      body: `${notice.clientName} ${booked ? "agendou" : "cancelou"} o horário de ${when}.`,
      icon: "/icons/icon-192.png",
      tag: notice.id,
    },
  );
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function useNotices() {
  const resource = useAsyncResource(
    () => listNotices(createBrowserSupabaseClient()),
    "notices",
    { cacheKey: "notices" },
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") resource.refetch();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [resource.refetch]);

  useEffect(() => {
    const notices = resource.data?.notices;
    if (!notices) return;
    const seen = readSeen();
    const next = seen ?? new Set<string>();
    if (seen) {
      for (const notice of notices) {
        if (next.has(notice.id)) continue;
        showForegroundNotice(
          notice,
          resource.data?.timezone ?? "America/Sao_Paulo",
        );
        next.add(notice.id);
      }
    } else {
      for (const notice of notices) next.add(notice.id);
    }
    writeSeen(next);
  }, [resource.data]);

  return resource;
}
