"use client";

import { useRef } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cancelAppointmentAsProvider } from "../api/cancel-appointment-as-provider";

export function useProviderCancelAppointment() {
  const idempotencyKeysRef = useRef(new Map<string, string>());

  const action = useAsyncAction(
    (appointmentId: string) => {
      const keys = idempotencyKeysRef.current;
      let idempotencyKey = keys.get(appointmentId);
      if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID();
        keys.set(appointmentId, idempotencyKey);
      }
      return cancelAppointmentAsProvider(createBrowserSupabaseClient(), {
        appointmentId,
        idempotencyKey,
      });
    },
    {
      successMessage:
        "Agendamento cancelado. O cliente será avisado por email.",
    },
  );

  return {
    status: action.status,
    data: action.data,
    error: action.error,
    cancel: action.run,
    reset: action.reset,
    isIdempotent: action.error?.code === "IDEMPOTENT",
  };
}
