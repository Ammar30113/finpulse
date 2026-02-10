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
  const { data, loading, error, refresh } = useDashboard();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Header title="Dashboard" onRefresh={refresh} />
        <main className="p-4 lg:p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-white shadow-sm" />
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
              <InsightsPanel />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
