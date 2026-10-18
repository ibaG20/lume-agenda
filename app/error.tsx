"use client";

import { useEffect } from "react";
import { RouteErrorPanel } from "@/components/molecules/route-error";

export default function AppError({
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
      description="Não foi possível carregar esta página. Tente de novo em instantes."
      onRetry={retry}
      title="Algo deu errado"
    />
  );
}
