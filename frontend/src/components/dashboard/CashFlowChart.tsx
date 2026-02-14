"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "@/components/layout/ThemeProvider";

interface Props {
  income: number;
  expenses: number;
  cashFlow: number;
}

const fmt = (n: number) => n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function CashFlowChart({ income, expenses, cashFlow }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const data = [
    { name: "Income", value: income, fill: isDark ? "#4ade80" : "#0f7a4d" },
    { name: "Expenses", value: expenses, fill: isDark ? "#fb7185" : "#b42318" },
  ];

  return (
    <Card>
      <CardTitle>Monthly Cash Flow</CardTitle>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: isDark ? "#b5b5b5" : "#565b63" }} />
            <YAxis tick={{ fontSize: 12, fill: isDark ? "#b5b5b5" : "#565b63" }} />
            <Tooltip
              formatter={(value: number) => fmt(value)}
              contentStyle={{
                background: isDark ? "#121212" : "#ffffff",
                borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(20,20,20,0.12)",
                color: isDark ? "#f4f4f4" : "#101113",
                borderRadius: "12px",
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-center">
        <span className="text-sm text-[var(--fp-text-muted)]">Net: </span>
        <span className={`font-semibold ${cashFlow >= 0 ? "text-[var(--fp-positive)]" : "text-[var(--fp-negative)]"}`}>
          {fmt(cashFlow)}
        </span>
      </div>
    </Card>
  );
}
