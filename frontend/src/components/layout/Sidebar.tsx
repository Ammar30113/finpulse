"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { href: "/accounts", label: "Accounts", icon: "M3 7.5h18M3 12h18M3 16.5h18M5.25 4.5h13.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6A1.5 1.5 0 015.25 4.5z" },
  { href: "/weekly-review", label: "Weekly Review", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { href: "/expenses", label: "Expenses", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" },
  { href: "/transactions", label: "Transactions", icon: "M4.5 6.75h15m-15 5.25h15m-15 5.25h15" },
  { href: "/credit-cards", label: "Credit Cards", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { href: "/investments", label: "Investments", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { href: "/goals", label: "Goals", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  { href: "/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[var(--fp-border)] bg-[var(--fp-surface)]/95 backdrop-blur-xl lg:block">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--fp-border)] px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--fp-border)] bg-[var(--fp-surface-elev)] text-xs font-semibold tracking-[0.2em] text-[var(--fp-text)]">
          FP
        </div>
        <div>
          <p
            className="text-lg font-semibold leading-none tracking-tight text-[var(--fp-text)]"
            style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
          >
            FinPulse
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--fp-text-soft)]">
            Finance OS
          </p>
        </div>
      </div>
      <nav className="mt-4 space-y-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "border border-[var(--fp-border)] bg-[var(--fp-surface-elev)] text-[var(--fp-text)]"
                  : "text-[var(--fp-text-muted)] hover:bg-[var(--fp-surface-elev)] hover:text-[var(--fp-text)]"
              )}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute inset-x-0 bottom-0 border-t border-[var(--fp-border)] px-6 py-4">
        <p className="text-xs leading-relaxed text-[var(--fp-text-soft)]">
          Weekly goal: complete one action that moves your finances forward.
        </p>
      </div>
    </aside>
  );
}
