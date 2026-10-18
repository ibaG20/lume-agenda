"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";
import { BrandLogo } from "@/components/atoms/brand-logo";
import { SubmitButton } from "@/components/atoms/submit-button";
import { ResourceFeedback } from "@/components/molecules/resource-feedback";
import { useConfirm } from "@/components/organisms/confirm-dialog";
import { AppointmentSummary } from "@/features/public-booking/components/appointment-summary";
import { useCancelAppointment } from "../../hooks/use-cancel-appointment";
import { useCancellationPreview } from "../../hooks/use-cancellation-preview";
import type { CancellationPreviewDto } from "../../types";
import styles from "./index.module.css";

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export function providerSchedulePath(publicSlug: string): string {
  return `/${encodeURIComponent(publicSlug)}/agendar`;
}

function localDate(iso: string, timezone: string): string {
  try {
    return Temporal.Instant.from(iso)
      .toZonedDateTimeISO(timezone)
      .toPlainDate()
      .toString();
  } catch {
    return Temporal.Instant.from(iso)
      .toZonedDateTimeISO(DEFAULT_TIMEZONE)
      .toPlainDate()
      .toString();
  }
}

function CancelShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <BrandLogo size={36} />
      </header>
      <div className={styles.content}>{children}</div>
    </main>
  );
}

function AppointmentDetails({ preview }: { preview: CancellationPreviewDto }) {
  const timezone = preview.timezone || DEFAULT_TIMEZONE;
  const date = localDate(preview.start, timezone);

  return (
    <AppointmentSummary
      providerName={preview.providerName}
      slot={{ date, start: preview.start, end: preview.end }}
      timezone={timezone}
    />
  );
}

export function CancelAppointmentScreen({ token }: { token: string }) {
  const preview = useCancellationPreview(token);
  const cancellation = useCancelAppointment();
  const confirm = useConfirm();
  const cancelled =
    preview.data?.status === "CANCELLED" ||
    cancellation.status === "success" ||
    cancellation.isIdempotent;

  async function confirmCancellation() {
    const accepted = await confirm({
      title: "Cancelar este horário?",
      description:
        "O horário volta a ficar disponível. Esta ação não pode ser desfeita por este link.",
      confirmLabel: "Cancelar agendamento",
      cancelLabel: "Manter horário",
      tone: "danger",
    });
    if (!accepted) return;
    await cancellation.cancel(token);
  }

  if (!token) {
    return (
      <CancelShell>
        <ResourceFeedback
          description="Abra o link completo que chegou no e-mail de confirmação."
          kind="error"
          title="Link de cancelamento incompleto"
        />
      </CancelShell>
    );
  }

  if (preview.status === "pending" || preview.status === "idle") {
    return (
      <CancelShell>
        <ResourceFeedback kind="loading" title="Carregando agendamento…" />
      </CancelShell>
    );
  }

  if (preview.status === "error" || !preview.data) {
    return (
      <CancelShell>
        <ResourceFeedback
          description="O link pode ter sido alterado ou o agendamento não existe mais."
          kind="error"
          onRetry={preview.refetch}
          title="Não encontramos este agendamento"
        />
      </CancelShell>
    );
  }

  const schedulePath = preview.data.publicSlug
    ? providerSchedulePath(preview.data.publicSlug)
    : "";

  return (
    <CancelShell>
      <section className={styles.narrow} aria-labelledby="cancel-title">
        <header className={styles.headerCopy}>
          <p className={styles.eyebrow} data-cancelled={cancelled}>
            {cancelled ? "Horário liberado" : "Confirme o cancelamento"}
          </p>
          <h1 id="cancel-title">
            {cancelled
              ? "Agendamento cancelado"
              : "Quer cancelar este horário?"}
          </h1>
          <p>
            {cancelled
              ? `${preview.data.providerName} já não espera você neste horário.`
              : `Este horário continua reservado com ${preview.data.providerName} até você confirmar o cancelamento.`}
          </p>
        </header>

        <AppointmentDetails preview={preview.data} />

        {cancelled ? (
          <div className={styles.actions}>
            {schedulePath ? (
              <Link className="btn btn-primary" href={schedulePath}>
                Escolher outro horário
              </Link>
            ) : null}
          </div>
        ) : (
          <div className={styles.actions}>
            <SubmitButton
              className="btn btn-error"
              onClick={confirmCancellation}
              pending={cancellation.status === "pending"}
              pendingLabel="Cancelando…"
              type="button"
            >
              Cancelar agendamento
            </SubmitButton>
            {cancellation.status === "error" && cancellation.error ? (
              <p className={styles.error} role="alert">
                {cancellation.error.message}
              </p>
            ) : null}
          </div>
        )}
      </section>
    </CancelShell>
  );
}
