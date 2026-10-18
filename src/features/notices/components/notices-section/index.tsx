"use client";

import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/atoms/submit-button";
import { ResourceFeedback } from "@/components/molecules/resource-feedback";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { formatLongDate, formatTime } from "@/lib/date-time/dashboard";
import { Temporal } from "@js-temporal/polyfill";
import { enableMobileNotifications } from "../../enable-notifications";
import { useDismissNotice } from "../../hooks/use-dismiss-notice";
import { useNotices } from "../../hooks/use-notices";
import styles from "./index.module.css";

function localDate(iso: string, timezone: string): string {
  return Temporal.Instant.from(iso)
    .toZonedDateTimeISO(timezone)
    .toPlainDate()
    .toString();
}

export function NoticesSection() {
  const notices = useNotices();
  const dismissal = useDismissNotice(() => notices.refetch());
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported" | "unknown"
  >("unknown");

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);
  const timezone = notices.data?.timezone ?? "America/Sao_Paulo";
  const visible =
    notices.data?.notices.filter((notice) => !hiddenIds.includes(notice.id)) ??
    [];

  async function enableNotifications() {
    const next = await enableMobileNotifications(createBrowserSupabaseClient());
    setPermission(next);
  }

  return (
    <section aria-labelledby="notices-title" className={styles.section}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Avisos</p>
          <h2 id="notices-title">Cancelamentos de clientes</h2>
        </div>
        {visible.length > 0 ? (
          <span className={styles.counter}>{visible.length}</span>
        ) : null}
      </div>

      {permission === "default" ? (
        <div className={styles.permission}>
          <p>
            Ative os avisos do celular para saber quando um cliente cancelar,
            mesmo com o app fechado.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => void enableNotifications()}
            type="button"
          >
            Ativar avisos
          </button>
        </div>
      ) : null}
      {permission === "denied" ? (
        <p className={styles.denied}>
          As notificações do celular estão bloqueadas. Os cancelamentos
          continuam aparecendo nesta lista.
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
      {notices.data && visible.length === 0 ? (
        <p className={styles.empty}>Nenhum cancelamento de cliente por enquanto.</p>
      ) : null}
      {visible.length > 0 ? (
        <ul className={styles.list}>
          {visible.map((notice) => (
            <li className={styles.notice} key={notice.id}>
              <p>
                <strong>{notice.clientName}</strong> cancelou o horário de{" "}
                {formatLongDate(localDate(notice.start, timezone))},{" "}
                {formatTime(notice.start, timezone)}.
              </p>
              <SubmitButton
                className="btn btn-outline btn-sm"
                onClick={() => {
                  void dismissal.dismiss(notice.id).then((result) => {
                    if (result.ok) {
                      setHiddenIds((current) => [...current, notice.id]);
                    }
                  });
                }}
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
