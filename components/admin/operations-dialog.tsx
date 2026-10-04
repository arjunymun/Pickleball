"use client";
import { useEffect, useRef, type ReactNode } from "react";
import styles from "./operations.module.css";
export function OperationsDialog({ title, onClose, children, dismissDisabled = false }: { title: string; onClose: () => void; children: ReactNode; dismissDisabled?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => { dialog?.close(); previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return <dialog className={styles.dialog} ref={ref} aria-labelledby="operations-dialog-title" onCancel={(event) => { event.preventDefault(); if (!dismissDisabled) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !dismissDisabled) onClose(); }}><div className={styles.dialogHeader}><h2 id="operations-dialog-title">{title}</h2><button type="button" className={styles.close} onClick={onClose} disabled={dismissDisabled} aria-label="Close details">×</button></div>{children}</dialog>;
}
