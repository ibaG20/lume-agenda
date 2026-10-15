"use client";

import type { ReactNode } from "react";
import { ConfirmProvider } from "@/components/organisms/confirm-dialog";
import { ToastProvider } from "@/components/organisms/toaster";
import { InstallPrompt } from "@/lib/pwa/install-prompt";
import { RegisterServiceWorker } from "@/lib/pwa/register-sw";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        {children}
        <InstallPrompt />
        <RegisterServiceWorker />
      </ConfirmProvider>
    </ToastProvider>
  );
}
