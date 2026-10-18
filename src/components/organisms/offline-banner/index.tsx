"use client";

import { useOffline } from "next/offline";
import styles from "./index.module.css";

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div className={styles.banner} role="status">
      Sem conexão. Dá para consultar o que já foi aberto. Enviar alterações fica
      bloqueado até a internet voltar.
    </div>
  );
}
