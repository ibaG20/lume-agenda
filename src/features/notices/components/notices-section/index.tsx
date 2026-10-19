"use client";

import { startTransition, useEffect, useOptimistic, useState } from "react";
import { SubmitButton } from "@/components/atoms/submit-button";
import { ResourceFeedback } from "@/components/molecules/resource-feedback";
import { formatLongDate, formatTime } from "@/lib/date-time/dashboard";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Temporal } from "@js-temporal/polyfill";
import {
  enableMobileNotifications,
  getMobileNotificationStatus,
  type MobileNotificationStatus,
} from "../../enable-notifications";
import { useDismissNotice } from "../../hooks/use-dismiss-notice";
import { useNotices } from "../../hooks/use-notices";
import styles from "./index.module.css";

function localDate(iso: string, timezone: string): string {
  return Temporal.Instant.from(iso)
    .toZonedDateTimeISO(timezone)
    .toPlainDate()
    .toString();
}

function noticeAction(eventType: "CLIENT_BOOKED" | "CLIENT_CANCELLED") {
  return eventType === "CLIENT_BOOKED" ? "agendou" : "cancelou";
}

export function NoticesSection() {
  const notices = useNotices();
  const dismissal = useDismissNotice(() => notices.refetch());
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [notificationStatus, setNotificationStatus] =
    useState<MobileNotificationStatus>();
  const [notificationError, setNotificationError] = useState<string>();
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [optimisticHiddenIds, hideOptimistically] = useOptimistic(
    hiddenIds,
    (current, noticeId: string) => [...current, noticeId],
  );
  const timezone = notices.data?.timezone ?? "America/Sao_Paulo";
  const visible =
    notices.data?.notices.filter(
      (notice) => !optimisticHiddenIds.includes(notice.id),
    ) ?? [];

  useEffect(() => {
    let active = true;
    void getMobileNotificationStatus()
      .then((status) => {
        if (active) setNotificationStatus(status);
      })
      .catch(() => {
        if (active) setNotificationStatus("granted");
      });
    return () => {
      active = false;
    };
  }, []);

  async function enableNotifications() {
    setEnablingNotifications(true);
    setNotificationError(undefined);
    try {
      const status = await enableMobileNotifications(
        createBrowserSupabaseClient(),
      );
      setNotificationStatus(status);
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Não foi possível ativar as notificações.",
      );
    } finally {
      setEnablingNotifications(false);
    }
  }

  function dismissNotice(noticeId: string) {
    startTransition(async () => {
      hideOptimistically(noticeId);
      const result = await dismissal.dismiss(noticeId);
      if (result.ok) {
        setHiddenIds((current) => [...current, noticeId]);
      }
    });
  }

  const canEnable =
    notificationStatus === "default" || notificationStatus === "granted";
  const showSection =
    canEnable ||
    Boolean(notificationError) ||
    notices.status === "pending" ||
    notices.status === "error" ||
    visible.length > 0;

  if (!showSection) return null;

  return (
    <section aria-labelledby="notices-title" className={styles.section}>
      <h2 className={styles.eyebrow} id="notices-title">
        Avisos
      </h2>

      {canEnable ? (
        <div className={styles.permission}>
          <p>
            Ative os avisos do celular para saber quando um cliente agendar ou
            cancelar, mesmo com o app fechado.
          </p>
          <SubmitButton
            className="btn btn-primary btn-sm"
            onClick={() => void enableNotifications()}
            pending={enablingNotifications}
            pendingLabel="Ativando…"
            type="button"
          >
            Ativar avisos
          </SubmitButton>
        </div>
      ) : null}
      {notificationError ? (
        <p className={styles.feedback} role="alert">
          {notificationError}
        </p>
      ) : null}

      {notices.status === "pending" && !notices.data ? (
        <ResourceFeedback kind="loading" title="Carregando avisos…" />
      ) : null}
      {notices.status === "error" ? (
        <ResourceFeedback
          description={notices.error.message}
          kind="error"
          onRetry={notices.refetch}
          title="Não foi possível carregar os avisos"
        />
      ) : null}

      {visible.length > 0 ? (
        <ul className={styles.list}>
          {visible.map((notice) => (
            <li
              className={styles.notice}
              data-event-type={notice.eventType}
              key={notice.id}
            >
              <p>
                <strong>{notice.clientName}</strong>{" "}
                {noticeAction(notice.eventType)} o horário de{" "}
                {formatLongDate(localDate(notice.start, timezone))},{" "}
                {formatTime(notice.start, timezone)}.
              </p>
              <SubmitButton
                className="btn btn-outline btn-sm"
                onClick={() => dismissNotice(notice.id)}
                pending={dismissal.status === "pending"}
                type="button"
              >
                Dispensar
              </SubmitButton>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
