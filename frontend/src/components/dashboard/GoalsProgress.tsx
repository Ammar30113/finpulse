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
                <span className="font-medium text-gray-900 truncate">{g.title}</span>
                <span className="text-gray-500">{g.progress_pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={clsx(
                    "h-2 rounded-full transition-all",
                    g.progress_pct >= 75 ? "bg-green-500" : g.progress_pct >= 40 ? "bg-brand-500" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.min(g.progress_pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>${g.current_amount.toLocaleString()}</span>
                <span>${g.target_amount.toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">No goals set yet</p>
      )}
    </Card>
  );
}
