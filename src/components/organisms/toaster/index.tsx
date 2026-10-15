"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import styles from "./index.module.css";

export type ToastTone = "success" | "error" | "info" | "warning";

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

type ToastRecord = ToastInput & { id: number; tone: ToastTone };

type ToastContextValue = {
  push: (toast: ToastInput) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const tone = toast.tone ?? "info";
      const durationMs = toast.durationMs ?? 4500;
      setToasts((current) => [...current.slice(-3), { ...toast, id, tone }]);
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [dismiss, push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport}>
        {toasts.map((toast) => (
          <article
            aria-live={toast.tone === "error" ? "assertive" : "polite"}
            className={styles.toast}
            data-tone={toast.tone}
            key={toast.id}
            role="status"
          >
            <div>
              <strong>{toast.title}</strong>
              {toast.description ? <p>{toast.description}</p> : null}
            </div>
            <button
              aria-label="Fechar aviso"
              onClick={() => dismiss(toast.id)}
              type="button"
            >
              ×
            </button>
          </article>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      push: () => undefined,
      dismiss: () => undefined,
    };
  }
  return context;
}
