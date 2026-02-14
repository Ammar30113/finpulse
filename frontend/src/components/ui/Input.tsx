import { clsx } from "clsx";
import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--fp-text-muted)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          "block w-full rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-solid)] px-3 py-2.5 text-[15px] text-[var(--fp-text)] shadow-sm transition-colors placeholder:text-[var(--fp-text-soft)] focus:border-[var(--fp-text)] focus:ring-[var(--fp-text)]",
          error && "border-[var(--fp-negative)]/70 focus:border-[var(--fp-negative)] focus:ring-[var(--fp-negative)]",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-[var(--fp-negative)]">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-[var(--fp-text-muted)]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          "block w-full rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-solid)] px-3 py-2.5 text-[15px] text-[var(--fp-text)] shadow-sm transition-colors focus:border-[var(--fp-text)] focus:ring-[var(--fp-text)]",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
