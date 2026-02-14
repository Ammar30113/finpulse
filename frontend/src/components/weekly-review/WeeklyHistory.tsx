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
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  skipped: { label: "Skipped", className: "bg-gray-100 text-gray-600" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
};

export function WeeklyHistory({ history }: Props) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">History</h2>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <p className="text-sm font-medium text-gray-500">Completion Rate</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {history.wacr.toFixed(0)}%
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray-500">Current Streak</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {history.current_streak} {history.current_streak === 1 ? "week" : "weeks"}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray-500">Actions Completed</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {history.total_completed}{" "}
            <span className="text-sm font-normal text-gray-400">
              / {history.total_reviews}
            </span>
          </p>
        </Card>
      </div>

      {/* Timeline */}
      {history.reviews.length > 1 && (
        <Card>
          <p className="text-sm font-medium text-gray-500 mb-4">Past Actions</p>
          <div className="space-y-0">
            {history.reviews.slice(1).map((r, i) => {
              const badge = statusBadge[r.action.status] || statusBadge.pending;
              return (
                <div key={r.id} className={clsx("flex items-start gap-4 py-3", i > 0 && "border-t border-gray-100")}>
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div
                      className={clsx(
                        "h-2.5 w-2.5 rounded-full",
                        r.action.status === "completed"
                          ? "bg-green-500"
                          : r.action.status === "skipped"
                          ? "bg-gray-300"
                          : "bg-amber-400"
                      )}
                    />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate">
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
                    <p className="text-xs text-gray-400 mt-0.5">
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
