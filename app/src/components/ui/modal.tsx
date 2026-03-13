"use client";

import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

export function Modal({ open, title, onOpenChange, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={() => onOpenChange(false)}>
      <div
        className="modal-shell"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="btn-ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}
