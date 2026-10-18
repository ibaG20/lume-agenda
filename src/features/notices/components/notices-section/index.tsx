"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/atoms/submit-button";
import { formatLongDate, formatTime } from "@/lib/date-time/dashboard";
import { Temporal } from "@js-temporal/polyfill";
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
  const timezone = notices.data?.timezone ?? "America/Sao_Paulo";
  const visible =
    notices.data?.notices.filter((notice) => !hiddenIds.includes(notice.id)) ??
    [];

  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="notices-title" className={styles.section}>
      <h2 className={styles.eyebrow} id="notices-title">
        Avisos
      </h2>

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
    </section>
  );
}
