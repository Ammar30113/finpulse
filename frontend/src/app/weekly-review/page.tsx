"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWeeklyReview } from "@/hooks/useWeeklyReview";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { WeeklySnapshot } from "@/components/weekly-review/WeeklySnapshot";
import { WeeklyAction } from "@/components/weekly-review/WeeklyAction";
import { WeeklyHistory } from "@/components/weekly-review/WeeklyHistory";

export default function WeeklyReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const { review, history, loading, error, completing, refresh, completeAction, skipAction } =
    useWeeklyReview();
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
        <Header title="Weekly Review" onRefresh={refresh} />
        <main className="p-4 pb-8 lg:p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {error && (
              <div className="rounded-xl border border-[var(--fp-negative)]/35 bg-[var(--fp-negative)]/10 p-4 text-sm text-[var(--fp-negative)]">
                {error}
              </div>
            )}
            {loading ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--fp-surface)]" />
                  ))}
                </div>
                <div className="h-48 animate-pulse rounded-2xl bg-[var(--fp-surface)]" />
                <div className="h-64 animate-pulse rounded-2xl bg-[var(--fp-surface)]" />
              </div>
            ) : review ? (
              <>
                <WeeklySnapshot
                  snapshot={review.snapshot}
                  changes={review.changes}
                  weekStart={review.week_start}
                  weekEnd={review.week_end}
                />
                <WeeklyAction
                  action={review.action}
                  completing={completing}
                  onComplete={completeAction}
                  onSkip={skipAction}
                />
                {history && <WeeklyHistory history={history} />}
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
