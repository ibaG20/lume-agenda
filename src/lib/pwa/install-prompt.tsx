"use client";

import { useEffect, useState } from "react";
import styles from "./install-prompt.module.css";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!promptEvent) return null;

  return (
    <aside className={styles.banner}>
      <p>Instale o Lume Agendas na tela inicial para abrir como um app.</p>
      <div className={styles.actions}>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            void promptEvent.prompt();
            setPromptEvent(null);
          }}
          type="button"
        >
          Instalar
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setPromptEvent(null)}
          type="button"
        >
          Agora não
        </button>
      </div>
    </aside>
  );
}
