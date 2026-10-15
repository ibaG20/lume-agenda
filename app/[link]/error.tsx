"use client";

import { useEffect } from "react";
import { RouteErrorPanel } from "@/components/molecules/route-error";

export default function BookingError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <RouteErrorPanel
      description="Não foi possível continuar o agendamento. Tente de novo."
      onRetry={retry}
      title="Agendamento indisponível"
    />
  );
}
