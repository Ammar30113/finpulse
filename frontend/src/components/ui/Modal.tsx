"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface-solid)] p-6 shadow-[var(--fp-shadow)]">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-xl font-semibold leading-tight text-[var(--fp-text)]"
            style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-xl leading-none text-[var(--fp-text-soft)] transition-colors hover:bg-[var(--fp-surface-elev)] hover:text-[var(--fp-text)]"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
