"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { CreditCardsPanel } from "@/components/dashboard/CreditCardsPanel";
import { UpcomingBills } from "@/components/dashboard/UpcomingBills";
import { GoalsProgress } from "@/components/dashboard/GoalsProgress";
import { InsightsPanel } from "@/components/dashboard/InsightsPanel";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { data, insights, loading, error, refresh } = useDashboard();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className="flex min-h-screen text-[var(--fp-text)]">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at 10% 14%, rgba(255,255,255,0.12), transparent 28%), radial-gradient(circle at 82% 8%, rgba(255,255,255,0.08), transparent 26%), linear-gradient(156deg, var(--fp-bg) 0%, var(--fp-bg-soft) 100%)",
        }}
      />
      <Sidebar />
      <div className="relative z-10 flex-1 lg:ml-64">
        <Header title="Dashboard" onRefresh={refresh} />
        <main className="p-4 pb-8 lg:p-6">
          <section className="mb-5 rounded-2xl border border-[var(--fp-border)] bg-[var(--fp-surface)] px-5 py-4 shadow-[var(--fp-shadow)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--fp-text-soft)]">Command View</p>
            <p className="mt-1 text-sm text-[var(--fp-text-muted)]">
              Review your financial health, then complete one high-impact action this week.
            </p>
          </section>
          {error && (
            <div className="mb-4 rounded-xl border border-[var(--fp-negative)]/35 bg-[var(--fp-negative)]/10 p-4 text-sm text-[var(--fp-negative)]">
              {error}
            </div>
          )}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl bg-[var(--fp-surface)]/70" />
              ))}
            </div>
          ) : data ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <NetWorthCard
                netWorth={data.net_worth}
                assets={data.total_assets}
                liabilities={data.total_liabilities}
              />
              <CashFlowChart
                income={data.monthly_income}
                expenses={data.monthly_expenses}
                cashFlow={data.cash_flow}
              />
              <CreditCardsPanel utilization={data.credit_utilization_pct} />
              <UpcomingBills bills={data.upcoming_bills} />
              <GoalsProgress goals={data.goals_summary} />
              <InsightsPanel data={insights} loading={loading} />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
