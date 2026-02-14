import { clsx } from "clsx";
import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-[var(--fp-text)] text-[var(--fp-bg)] hover:opacity-90 focus:ring-[var(--fp-text)]",
  secondary:
    "border border-[var(--fp-border)] bg-[var(--fp-surface)] text-[var(--fp-text-muted)] hover:bg-[var(--fp-surface-elev)] hover:text-[var(--fp-text)] focus:ring-[var(--fp-text)]",
  danger:
    "bg-[var(--fp-negative)] text-white hover:opacity-90 focus:ring-[var(--fp-negative)]",
  ghost:
    "text-[var(--fp-text-muted)] hover:bg-[var(--fp-surface-elev)] hover:text-[var(--fp-text)] focus:ring-[var(--fp-text-muted)]",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--fp-bg)] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
