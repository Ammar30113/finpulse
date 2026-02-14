import { Card } from "@/components/ui/Card";
import type { WeeklyChanges, WeeklySnapshotData } from "@/lib/types";
import { clsx } from "clsx";

interface Props {
  snapshot: WeeklySnapshotData;
  changes: WeeklyChanges | null;
  weekStart: string;
  weekEnd: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

interface MetricCardProps {
  label: string;
  value: string;
  change?: { absolute: number; pct: number | null } | null;
  invertColor?: boolean;
}

function MetricCard({ label, value, change, invertColor }: MetricCardProps) {
  const hasChange = change && change.absolute !== 0;
  const isPositive = hasChange ? change!.absolute > 0 : false;
  const isGood = invertColor ? !isPositive : isPositive;

  return (
    <Card>
      <p className="text-sm font-medium text-[var(--fp-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--fp-text)]">{value}</p>
      {hasChange && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={clsx(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              isGood
                ? "bg-[var(--fp-positive)]/15 text-[var(--fp-positive)]"
                : "bg-[var(--fp-negative)]/15 text-[var(--fp-negative)]"
            )}
          >
            {isPositive ? "\u2191" : "\u2193"}{" "}
            {Math.abs(change!.absolute).toLocaleString("en-CA", {
              style: "currency",
              currency: "CAD",
              maximumFractionDigits: 0,
            })}
            {change!.pct != null && ` (${Math.abs(change!.pct).toFixed(1)}%)`}
          </span>
          <span className="text-xs text-[var(--fp-text-soft)]">vs last week</span>
        </div>
      )}
    </Card>
  );
}

export function WeeklySnapshot({ snapshot, changes, weekStart, weekEnd }: Props) {
  return (
    <div>
      <h2
        className="mb-4 text-2xl font-semibold tracking-tight text-[var(--fp-text)]"
        style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif' }}
      >
        Week of {formatDate(weekStart)} &ndash; {formatDate(weekEnd)}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Net Worth"
          value={fmt(snapshot.net_worth)}
          change={changes?.net_worth_change}
        />
        <MetricCard
          label="Weekly Spending"
          value={fmt(snapshot.weekly_spending)}
          change={changes?.spending_change}
          invertColor
        />
        <MetricCard
          label="Savings"
          value={fmt(snapshot.savings_balance)}
          change={changes?.savings_change}
        />
        <MetricCard
          label="Credit Utilization"
          value={`${snapshot.credit_utilization_pct.toFixed(0)}%`}
          change={changes?.utilization_change}
          invertColor
        />
      </div>
    </div>
  );
}
