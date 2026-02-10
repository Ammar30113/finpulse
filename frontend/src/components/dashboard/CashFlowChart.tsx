"use client";

import { Card, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  income: number;
  expenses: number;
  cashFlow: number;
}

const fmt = (n: number) => n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function CashFlowChart({ income, expenses, cashFlow }: Props) {
  const data = [
    { name: "Income", value: income, fill: "#22c55e" },
    { name: "Expenses", value: expenses, fill: "#ef4444" },
  ];

  return (
    <Card>
      <CardTitle>Monthly Cash Flow</CardTitle>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => fmt(value)} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-center">
        <span className="text-sm text-gray-500">Net: </span>
        <span className={`font-semibold ${cashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
          {fmt(cashFlow)}
        </span>
      </div>
    </Card>
  );
}
