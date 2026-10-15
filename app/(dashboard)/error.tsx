"use client";

import { useEffect } from "react";
import { RouteErrorPanel } from "@/components/molecules/route-error";

export default function DashboardError({
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
      description="A agenda não respondeu. Seus dados continuam salvos."
      onRetry={retry}
      title="Não foi possível abrir esta área"
    />
  );
}
