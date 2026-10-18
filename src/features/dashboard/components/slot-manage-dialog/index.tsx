"use client";

import { useState } from "react";
import { Modal } from "@/components/molecules/modal";
import type { AgendaSlot } from "@/features/agenda";
import { useSlotAvailability } from "@/features/overrides";
import { useProviderCancelAppointment } from "@/features/provider-cancellation";
import { formatLongDate, formatTime } from "@/lib/date-time/dashboard";
import type { ApiResult } from "@/types/api";
import styles from "./index.module.css";

type SlotManageDialogProps = {
  slot: AgendaSlot | null;
  date: string;
  timezone: string;
  onClose: () => void;
  onChanged: () => void;
};

const copy = {
  available: {
    title: "Inativar horário",
    description:
      "Clientes não poderão agendar este horário neste dia. Sua disponibilidade nas outras semanas continua a mesma.",
    confirm: "Inativar horário",
    pending: "Inativando…",
    dismiss: "Voltar",
    tone: "btn-warning",
  },
  blocked: {
    title: "Reativar horário",
    description:
      "O horário volta a ficar disponível para agendamento neste dia.",
    confirm: "Reativar horário",
    pending: "Reativando…",
    dismiss: "Voltar",
    tone: "btn-primary",
  },
  booked: {
    title: "Cancelar agendamento",
    description:
      "O cliente recebe um email avisando do cancelamento, com um link para escolher outro horário.",
    confirm: "Cancelar e avisar cliente",
    pending: "Cancelando…",
    dismiss: "Manter agendamento",
    tone: "btn-error",
  },
  cancelled: {
    title: "Agendamento cancelado",
    description:
      "O cliente será avisado por email. Este horário deve continuar disponível para novos agendamentos neste dia?",
    confirm: "Inativar horário",
    pending: "Inativando…",
    dismiss: "Manter disponível",
    tone: "btn-warning",
  },
} as const;

export function SlotManageDialog({
  slot,
  date,
  timezone,
  onClose,
  onChanged,
}: SlotManageDialogProps) {
  const [cancelled, setCancelled] = useState(false);
  const availability = useSlotAvailability();
  const cancellation = useProviderCancelAppointment();
  const isPending = availability.isPending || cancellation.status === "pending";
  const error = availability.error ?? cancellation.error;
  const text = !slot
    ? copy.available
    : cancelled
      ? copy.cancelled
      : copy[slot.state];

  function finish() {
    availability.reset();
    cancellation.reset();
    setCancelled(false);
    onClose();
  }

  function close() {
    if (isPending) return;
    finish();
  }

  async function run(): Promise<ApiResult<unknown> | null> {
    if (!slot) return null;
    if (slot.state === "available" || cancelled) {
      return availability.deactivate({ start: slot.start, end: slot.end });
    }
    if (slot.state === "blocked" && slot.overrideId) {
      return availability.reactivate(slot.overrideId);
    }
    if (slot.state === "booked" && slot.appointmentId) {
      return cancellation.cancel(slot.appointmentId);
    }
    return null;
  }

  async function confirm() {
    if (isPending) return;
    const result = await run();
    if (!result) return;
    if (result.ok || result.error.code === "IDEMPOTENT") {
      onChanged();
      if (slot?.state === "booked" && !cancelled) {
        setCancelled(true);
        return;
      }
      finish();
      return;
    }
    if (result.error.code === "CONFLICT" || result.error.code === "NOT_FOUND") {
      onChanged();
    }
  }

  return (
    <Modal
      description={text.description}
      footer={
        <>
          <button
            className="btn btn-ghost"
            disabled={isPending}
            onClick={close}
            type="button"
          >
            {text.dismiss}
          </button>
          <button
            className={`btn ${text.tone}`}
            disabled={isPending}
            onClick={() => void confirm()}
            type="button"
          >
            {isPending ? text.pending : text.confirm}
          </button>
        </>
      }
      onClose={close}
      open={slot !== null}
      title={text.title}
    >
      {slot ? (
        <>
          <dl
            className={styles.details}
            data-state={cancelled ? "available" : slot.state}
          >
            <div>
              <dt>Dia</dt>
              <dd>{formatLongDate(date)}</dd>
            </div>
            <div>
              <dt>Horário</dt>
              <dd>
                {formatTime(slot.start, timezone)} –{" "}
                {formatTime(slot.end, timezone)}
              </dd>
            </div>
            {slot.state === "booked" ? (
              <div>
                <dt>Cliente</dt>
                <dd>{slot.clientName ?? "Cliente agendado"}</dd>
              </div>
            ) : null}
          </dl>
          {error && error.code !== "IDEMPOTENT" ? (
            <p className={styles.error} role="alert">
              {error.message}
            </p>
          ) : null}
        </>
      ) : null}
    </Modal>
  );
}
