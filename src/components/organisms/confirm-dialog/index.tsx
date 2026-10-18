"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Modal } from "@/components/molecules/modal";

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function finish(accepted: boolean) {
    pending?.resolve(accepted);
    setPending(null);
  }

  const tone = pending?.tone ?? "primary";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        description={pending?.description}
        footer={
          <>
            <button
              className="btn btn-ghost"
              onClick={() => finish(false)}
              type="button"
            >
              {pending?.cancelLabel ?? "Cancelar"}
            </button>
            <button
              className={
                tone === "danger" ? "btn btn-error" : "btn btn-primary"
              }
              onClick={() => finish(true)}
              type="button"
            >
              {pending?.confirmLabel ?? "Confirmar"}
            </button>
          </>
        }
        onClose={() => finish(false)}
        open={pending !== null}
        title={pending?.title ?? "Confirmar"}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm precisa do ConfirmProvider.");
  }
  return context.confirm;
}
