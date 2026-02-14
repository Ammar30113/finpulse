import { Card } from "@/components/ui/Card";
import type { WeeklyReviewHistory } from "@/lib/types";
import { clsx } from "clsx";

interface Props {
  history: WeeklyReviewHistory;
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

const statusBadge: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-[var(--fp-positive)]/15 text-[var(--fp-positive)]" },
  skipped: { label: "Skipped", className: "bg-[var(--fp-surface-elev)] text-[var(--fp-text-muted)]" },
  pending: { label: "Pending", className: "bg-[var(--fp-warning)]/15 text-[var(--fp-warning)]" },
};

export function WeeklyHistory({ history }: Props) {
  return (
    <div>
      <h2
        className="mb-4 text-2xl font-semibold tracking-tight text-[var(--fp-text)]"
        style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
      >
        History
      </h2>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <p className="text-sm font-medium text-[var(--fp-text-muted)]">Completion Rate</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--fp-text)]">
            {history.wacr.toFixed(0)}%
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-[var(--fp-text-muted)]">Current Streak</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--fp-text)]">
            {history.current_streak} {history.current_streak === 1 ? "week" : "weeks"}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-[var(--fp-text-muted)]">Actions Completed</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--fp-text)]">
            {history.total_completed}{" "}
            <span className="text-sm font-normal text-[var(--fp-text-soft)]">
              / {history.total_reviews}
            </span>
          </p>
        </Card>
      </div>

      {/* Timeline */}
      {history.reviews.length > 1 && (
        <Card>
          <p className="mb-4 text-sm font-medium text-[var(--fp-text-muted)]">Past Actions</p>
          <div className="space-y-0">
            {history.reviews.slice(1).map((r, i) => {
              const badge = statusBadge[r.action.status] || statusBadge.pending;
              return (
                <div key={r.id} className={clsx("flex items-start gap-4 py-3", i > 0 && "border-t border-[var(--fp-border)]")}>
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={clsx(
                        "h-2.5 w-2.5 rounded-full",
                        r.action.status === "completed"
                          ? "bg-[var(--fp-positive)]"
                          : r.action.status === "skipped"
                          ? "bg-[var(--fp-text-soft)]"
                          : "bg-[var(--fp-warning)]"
                      )}
                    />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--fp-text)] truncate">
                        {r.action.title}
                      </span>
                      <span
                        className={clsx(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--fp-text-soft)]">
                      {formatDate(r.week_start)} &ndash; {formatDate(r.week_end)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
