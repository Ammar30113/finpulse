"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

type Theme = "light" | "dark";

const featureHighlights = [
  {
    title: "One Weekly Decision",
    body: "FinPulse prioritizes one concrete action each week so users move money with confidence instead of scrolling through dashboards.",
  },
  {
    title: "Full Financial Clarity",
    body: "Accounts, cards, expenses, goals, and investments are unified into a clean operating view in under a minute.",
  },
  {
    title: "Built for Behavioral Change",
    body: "Weekly Review tracks completion streaks and action consistency so outcomes improve, not just charts.",
  },
];

const operatingLoop = [
  {
    step: "01",
    title: "Capture",
    detail: "Add transactions, balances, and recurring obligations in minutes.",
  },
  {
    step: "02",
    title: "Review",
    detail: "Get one prioritized weekly action based on utilization, goals, and cash flow.",
  },
  {
    step: "03",
    title: "Compound",
    detail: "Complete your action, track streaks, and compound better decisions each week.",
  },
];

export default function Home() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("marketing_theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    localStorage.setItem("marketing_theme", theme);
  }, [theme]);

  const themeStyles = useMemo(() => {
    if (theme === "dark") {
      return {
        pageText: "text-neutral-100",
        dimText: "text-neutral-400",
        navBorder: "border-white/10",
        card: "border-white/10 bg-white/5",
        cardSoft: "border-white/10 bg-black/40",
        cardBold: "border-white/10 bg-white text-black",
        ctaPrimary: "bg-white text-black hover:bg-neutral-200",
        ctaSecondary: "border-white/25 text-neutral-100 hover:bg-white/10",
        background:
          "radial-gradient(circle at 12% 18%, rgba(255,255,255,0.14), transparent 34%), radial-gradient(circle at 82% 8%, rgba(255,255,255,0.08), transparent 30%), linear-gradient(156deg, #070707 0%, #111111 58%, #1a1a1a 100%)",
        grid:
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
      };
    }
    return {
      pageText: "text-neutral-950",
      dimText: "text-neutral-600",
      navBorder: "border-black/10",
      card: "border-black/10 bg-white/80",
      cardSoft: "border-black/10 bg-white/70",
      cardBold: "border-black/10 bg-black text-white",
      ctaPrimary: "bg-black text-white hover:bg-neutral-800",
      ctaSecondary: "border-black/20 text-neutral-900 hover:bg-black/5",
      background:
        "radial-gradient(circle at 14% 16%, rgba(0,0,0,0.1), transparent 32%), radial-gradient(circle at 84% 8%, rgba(0,0,0,0.06), transparent 30%), linear-gradient(156deg, #f8f8f4 0%, #f1f1ec 52%, #e9e9e2 100%)",
      grid:
        "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
    };
  }, [theme]);

  return (
    <div
      className={clsx("relative min-h-screen overflow-hidden transition-colors duration-500", themeStyles.pageText)}
      style={{ fontFamily: '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif' }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: themeStyles.background }} />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: themeStyles.grid,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(circle at center, black 42%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 42%, transparent 80%)",
        }}
      />

      <header
        className={clsx(
          "sticky top-0 z-20 border-b backdrop-blur-xl transition-colors duration-500",
          themeStyles.navBorder,
          theme === "dark" ? "bg-black/35" : "bg-[#f7f7f2]/70"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-sm border text-xs font-semibold tracking-[0.18em]",
                themeStyles.card
              )}
            >
              FP
            </div>
            <div>
              <p
                className="text-lg font-semibold tracking-tight"
                style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
              >
                FinPulse
              </p>
              <p className={clsx("text-[11px] uppercase tracking-[0.24em]", themeStyles.dimText)}>
                Weekly Financial Command Center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={clsx(
                "group flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                themeStyles.ctaSecondary
              )}
              aria-label="Toggle light or dark theme"
            >
              <span>{theme === "dark" ? "Dark" : "Light"}</span>
              <span
                className={clsx(
                  "relative h-5 w-10 rounded-full transition-colors",
                  theme === "dark" ? "bg-white/30" : "bg-black/20"
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 h-4 w-4 rounded-full transition-all",
                    theme === "dark" ? "left-5 bg-white" : "left-0.5 bg-black"
                  )}
                />
              </span>
            </button>
            <Link
              href={user ? "/dashboard" : "/login"}
              className={clsx("rounded-full px-5 py-2 text-sm font-semibold transition-colors", themeStyles.ctaPrimary)}
            >
              {user ? "Open Dashboard" : "Get Started"}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
          <div className="space-y-7 reveal-rise">
            <p className={clsx("inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs uppercase tracking-[0.24em]", themeStyles.card)}>
              Wealth Discipline, Weekly
            </p>
            <h1
              className="text-4xl leading-tight sm:text-5xl lg:text-6xl"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
            >
              The private-wealth style operating system for personal finance.
            </h1>
            <p className={clsx("max-w-xl text-base leading-relaxed sm:text-lg", themeStyles.dimText)}>
              FinPulse translates your money data into one decisive weekly action so your net worth, savings
              resilience, and credit profile trend in the right direction.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={user ? "/dashboard" : "/login"}
                className={clsx("rounded-full px-6 py-3 text-sm font-semibold transition-colors", themeStyles.ctaPrimary)}
              >
                {user ? "Go to Dashboard" : "Start Weekly Review"}
              </Link>
              <a
                href="#features"
                className={clsx("rounded-full border px-6 py-3 text-sm font-semibold transition-colors", themeStyles.ctaSecondary)}
              >
                See Product Highlights
              </a>
            </div>
            <div className={clsx("grid gap-3 text-sm sm:grid-cols-3", themeStyles.dimText)}>
              <p>Clarity in under 60 seconds</p>
              <p>One prioritized weekly action</p>
              <p>Progress measured by completion</p>
            </div>
          </div>

          <div className="reveal-rise reveal-delay-1">
            <div className={clsx("rounded-3xl border p-6 shadow-2xl backdrop-blur", themeStyles.cardSoft)}>
              <p className={clsx("text-xs uppercase tracking-[0.24em]", themeStyles.dimText)}>Weekly Brief</p>
              <div className="mt-4 space-y-4">
                <div className={clsx("rounded-2xl border p-4", themeStyles.card)}>
                  <p className={clsx("text-xs uppercase tracking-[0.18em]", themeStyles.dimText)}>This Week&apos;s Priority</p>
                  <p className="mt-2 text-lg font-semibold">Pay down $420 on Chase Sapphire</p>
                  <p className={clsx("mt-2 text-sm", themeStyles.dimText)}>
                    Credit utilization is at 43%. Pushing below 30% improves score and lowers interest drag.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={clsx("rounded-2xl border p-4", themeStyles.card)}>
                    <p className={clsx("text-xs uppercase tracking-[0.14em]", themeStyles.dimText)}>Net Worth</p>
                    <p className="mt-2 text-2xl font-semibold">$184,200</p>
                    <p className="text-xs text-emerald-500">+2.8% this month</p>
                  </div>
                  <div className={clsx("rounded-2xl border p-4", themeStyles.card)}>
                    <p className={clsx("text-xs uppercase tracking-[0.14em]", themeStyles.dimText)}>WACR</p>
                    <p className="mt-2 text-2xl font-semibold">78%</p>
                    <p className="text-xs text-emerald-500">4-week streak active</p>
                  </div>
                </div>
                <div className={clsx("rounded-2xl border p-4", themeStyles.cardBold)}>
                  <p className={clsx("text-xs uppercase tracking-[0.16em]", theme === "dark" ? "text-black/60" : "text-white/70")}>
                    Decision Engine Summary
                  </p>
                  <p className={clsx("mt-2 text-sm", theme === "dark" ? "text-black/80" : "text-white/85")}>
                    You are liquid enough for 4.1 months of expenses. Keep investment contributions steady and
                    prioritize utilization reduction first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 pb-16">
          <div className="reveal-rise reveal-delay-2">
            <p className={clsx("text-xs uppercase tracking-[0.26em]", themeStyles.dimText)}>Why FinPulse</p>
            <h2
              className="mt-2 text-3xl sm:text-4xl"
              style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
            >
              Designed like a modern wealth desk, not a budgeting toy.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featureHighlights.map((feature, idx) => (
              <article
                key={feature.title}
                className={clsx("reveal-rise rounded-2xl border p-5 backdrop-blur", themeStyles.card)}
                style={{ animationDelay: `${(idx + 1) * 120}ms` }}
              >
                <p className={clsx("text-xs uppercase tracking-[0.2em]", themeStyles.dimText)}>
                  Highlight {(idx + 1).toString().padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-xl font-semibold">{feature.title}</h3>
                <p className={clsx("mt-3 text-sm leading-relaxed", themeStyles.dimText)}>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className={clsx("rounded-3xl border p-6 sm:p-8", themeStyles.cardSoft)}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="reveal-rise">
                <p className={clsx("text-xs uppercase tracking-[0.26em]", themeStyles.dimText)}>Weekly Operating Loop</p>
                <h2
                  className="mt-2 text-3xl sm:text-4xl"
                  style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
                >
                  A calm rhythm for financial progress.
                </h2>
              </div>
              <Link
                href={user ? "/weekly-review" : "/login"}
                className={clsx("rounded-full px-5 py-2.5 text-sm font-semibold transition-colors", themeStyles.ctaPrimary)}
              >
                View Weekly Review
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {operatingLoop.map((item, idx) => (
                <div
                  key={item.step}
                  className={clsx("reveal-rise rounded-2xl border p-5", themeStyles.card)}
                  style={{ animationDelay: `${(idx + 1) * 100}ms` }}
                >
                  <p className={clsx("text-xs uppercase tracking-[0.22em]", themeStyles.dimText)}>{item.step}</p>
                  <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                  <p className={clsx("mt-2 text-sm leading-relaxed", themeStyles.dimText)}>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
