"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AppIcon } from "@/components/atoms/app-icon";
import styles from "./index.module.css";

type PopoverProps = {
  label: string;
  children: ReactNode;
};

export function Popover({ label, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={label}
        className={styles.trigger}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <AppIcon name="info" size={18} />
      </button>
      {open ? (
        <div className={styles.panel} id={panelId} role="dialog">
          {children}
        </div>
      ) : null}
    </div>
  );
}
