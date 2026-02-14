import { Card, CardTitle } from "@/components/ui/Card";
import type { GoalSummary } from "@/lib/types";
import { clsx } from "clsx";

interface Props {
  goals: GoalSummary[];
}

export function GoalsProgress({ goals }: Props) {
  return (
    <Card>
      <CardTitle>Goals Progress</CardTitle>
      {goals.length > 0 ? (
        <ul className="space-y-4">
          {goals.slice(0, 4).map((g) => (
            <li key={g.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="truncate font-semibold text-[var(--fp-text)]">{g.title}</span>
                <span className="text-[var(--fp-text-muted)]">{g.progress_pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--fp-surface-elev)]">
                <div
                  className={clsx(
                    "h-2 rounded-full transition-all",
                    g.progress_pct >= 75
                      ? "bg-[var(--fp-positive)]"
                      : g.progress_pct >= 40
                      ? "bg-[var(--fp-text)]"
                      : "bg-[var(--fp-warning)]"
                  )}
                  style={{ width: `${Math.min(g.progress_pct, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-[var(--fp-text-soft)]">
                <span>${g.current_amount.toLocaleString()}</span>
                <span>${g.target_amount.toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--fp-text-soft)]">No goals set yet</p>
      )}
    </Card>
  );
}
