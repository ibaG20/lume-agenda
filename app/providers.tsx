"use client";

import type { ReactNode } from "react";
import { ConfirmProvider } from "@/components/organisms/confirm-dialog";
import { OfflineBanner } from "@/components/organisms/offline-banner";
import { ToastProvider } from "@/components/organisms/toaster";
import { InstallPrompt } from "@/lib/pwa/install-prompt";
import { RegisterServiceWorker } from "@/lib/pwa/register-sw";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <OfflineBanner />
        {children}
        <InstallPrompt />
        <RegisterServiceWorker />
      </ConfirmProvider>
    </ToastProvider>
  );
}
