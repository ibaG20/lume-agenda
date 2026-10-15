"use client";

import type { ReactNode } from "react";
import { ConfirmProvider } from "@/components/organisms/confirm-dialog";
import { ToastProvider } from "@/components/organisms/toaster";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
