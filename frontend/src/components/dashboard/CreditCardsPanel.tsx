"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { api } from "@/lib/api";
import type { CreditCard } from "@/lib/types";
import { clsx } from "clsx";

interface Props {
  utilization: number;
}

export function CreditCardsPanel({ utilization }: Props) {
  const [cards, setCards] = useState<CreditCard[]>([]);

  useEffect(() => {
    api.get<CreditCard[]>("/credit-cards").then(setCards).catch(() => {});
  }, []);

  const utilizationColor =
    utilization > 75
      ? "text-[var(--fp-negative)]"
      : utilization > 30
      ? "text-[var(--fp-warning)]"
      : "text-[var(--fp-positive)]";
  const barColor =
    utilization > 75 ? "bg-[var(--fp-negative)]" : utilization > 30 ? "bg-[var(--fp-warning)]" : "bg-[var(--fp-positive)]";

  return (
    <Card>
      <CardTitle>Credit Cards</CardTitle>
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <span className={clsx("text-2xl font-semibold", utilizationColor)}>
            {utilization.toFixed(0)}%
          </span>
          <span className="text-sm text-[var(--fp-text-muted)]">utilization</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[var(--fp-surface-elev)]">
          <div
            className={clsx("h-2 rounded-full transition-all", barColor)}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>
      {cards.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {cards.slice(0, 3).map((c) => (
            <li key={c.id} className="flex justify-between">
              <span className="truncate text-[var(--fp-text-muted)]">{c.name}</span>
              <span className="font-medium text-[var(--fp-text)]">
                ${c.current_balance.toLocaleString()} / ${c.credit_limit.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--fp-text-soft)]">No credit cards added</p>
      )}
    </Card>
  );
}
