"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import type { CategorySpendingPoint, SpendingTrendPoint } from "@/lib/types";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@/components/layout/ThemeProvider";

interface Props {
  weeklyTrend: SpendingTrendPoint[];
  categorySpending: CategorySpendingPoint[];
}

const formatCurrency = (value: number) =>
  value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function SpendingTrendsPanel({ weeklyTrend, categorySpending }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Card className="md:col-span-2 xl:col-span-2">
      <CardTitle>Spending Trends</CardTitle>
      <div className="grid gap-5 xl:grid-cols-2">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--fp-text-soft)]">
            Week-over-week
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#f97316" : "#a1460f"} stopOpacity={0.55} />
                    <stop offset="95%" stopColor={isDark ? "#f97316" : "#a1460f"} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: isDark ? "#b5b5b5" : "#565b63" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: isDark ? "#b5b5b5" : "#565b63" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${Math.round(v)}`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(_label, payload) => {
                    const row = payload?.[0]?.payload as SpendingTrendPoint | undefined;
                    return row ? `${row.week_start} to ${row.week_end}` : "Week";
                  }}
                  contentStyle={{
                    background: isDark ? "#121212" : "#ffffff",
                    borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(20,20,20,0.12)",
                    color: isDark ? "#f4f4f4" : "#101113",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="spending"
                  stroke={isDark ? "#fb923c" : "#a1460f"}
                  strokeWidth={2}
                  fill="url(#spendingTrendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {weeklyTrend.length > 1 && (
            <p className="mt-2 text-xs text-[var(--fp-text-muted)]">
              Latest week change:{" "}
              <span className="font-semibold text-[var(--fp-text)]">
                {weeklyTrend[weeklyTrend.length - 1].wow_change_pct === null
                  ? "N/A"
                  : `${weeklyTrend[weeklyTrend.length - 1].wow_change_pct}%`}
              </span>
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--fp-text-soft)]">
            Top categories this month
          </p>
          {categorySpending.length > 0 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categorySpending}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="category"
                    type="category"
                    width={95}
                    tick={{ fontSize: 11, fill: isDark ? "#b5b5b5" : "#565b63" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `${label}`}
                    contentStyle={{
                      background: isDark ? "#121212" : "#ffffff",
                      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(20,20,20,0.12)",
                      color: isDark ? "#f4f4f4" : "#101113",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 8, 8, 0]} fill={isDark ? "#14b8a6" : "#0d6f66"} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-44 items-center justify-center rounded-xl border border-[var(--fp-border)] bg-[var(--fp-surface-elev)]">
              <p className="text-sm text-[var(--fp-text-soft)]">No spending categories yet this month.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
