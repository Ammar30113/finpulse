"use client";

import { clsx } from "clsx";
import { useTheme } from "@/components/layout/ThemeProvider";

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
}

export function Header({ title, onRefresh }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--fp-border)] bg-[var(--fp-surface)]/90 px-4 backdrop-blur-xl lg:px-6">
      <div className="flex h-16 items-center justify-between">
        <h1
          className="text-2xl leading-none tracking-tight text-[var(--fp-text)]"
          style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
        >
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="rounded-full border border-[var(--fp-border)] px-3 py-2 text-xs font-medium text-[var(--fp-text-muted)] transition-colors hover:bg-[var(--fp-surface-elev)] hover:text-[var(--fp-text)]"
              title="Refresh"
            >
              Refresh
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-full border border-[var(--fp-border)] px-3 py-2 text-xs font-medium text-[var(--fp-text-muted)] transition-colors hover:bg-[var(--fp-surface-elev)] hover:text-[var(--fp-text)]"
            title="Switch theme"
          >
            <span>{theme === "dark" ? "Dark" : "Light"}</span>
            <span
              className={clsx(
                "relative h-4 w-8 rounded-full transition-colors",
                theme === "dark" ? "bg-white/30" : "bg-black/20"
              )}
            >
              <span
                className={clsx(
                  "absolute top-0.5 h-3 w-3 rounded-full transition-all",
                  theme === "dark" ? "left-4 bg-white" : "left-0.5 bg-black"
                )}
              />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
