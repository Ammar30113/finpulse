import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border bg-[var(--fp-surface)] shadow-[var(--fp-shadow)] backdrop-blur",
        "border-[var(--fp-border)]",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fp-text-muted)]">
      {children}
    </h3>
  );
}

export function CardValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={clsx("text-3xl font-semibold tracking-tight text-[var(--fp-text)]", className)}>{children}</p>;
}
