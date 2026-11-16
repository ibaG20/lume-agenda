"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AppIcon } from "@/components/atoms/app-icon";
import styles from "./index.module.css";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
  placement?: "left" | "right";
  spotlight?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  dismissible = true,
  placement,
  spotlight,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (typeof dialog.showModal === "function" && !dialog.open) {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      return;
    }

    if (dialog.open && typeof dialog.close === "function") {
      dialog.close();
    }
    dialog.removeAttribute("open");
  }, [open]);

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={styles.dialog}
      data-placement={placement}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose();
      }}
      ref={dialogRef}
    >
      {spotlight ? (
        <div
          aria-hidden="true"
          className={styles.spotlight}
          data-spotlight
          style={{
            height: spotlight.height,
            left: spotlight.left,
            top: spotlight.top,
            width: spotlight.width,
          }}
        >
          <span>
            <AppIcon name="alert" size={18} />
          </span>
        </div>
      ) : null}
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
        </header>
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </dialog>
  );
}
