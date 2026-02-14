"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { WeeklyAction as WeeklyActionType } from "@/lib/types";
import { clsx } from "clsx";

interface Props {
  action: WeeklyActionType;
  completing: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const borderColors: Record<string, string> = {
  pay_credit_card: "border-l-[var(--fp-negative)]",
  fund_goal: "border-l-[var(--fp-text)]",
  reduce_spending: "border-l-[var(--fp-warning)]",
  build_emergency_fund: "border-l-[var(--fp-positive)]",
  review_transactions: "border-l-[var(--fp-text-soft)]",
};

const badgeColors: Record<string, string> = {
  pay_credit_card: "bg-[var(--fp-negative)]/15 text-[var(--fp-negative)]",
  fund_goal: "bg-[var(--fp-text)]/10 text-[var(--fp-text)]",
  reduce_spending: "bg-[var(--fp-warning)]/15 text-[var(--fp-warning)]",
  build_emergency_fund: "bg-[var(--fp-positive)]/15 text-[var(--fp-positive)]",
  review_transactions: "bg-[var(--fp-surface-elev)] text-[var(--fp-text-muted)]",
};

const fmt = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function WeeklyAction({ action, completing, onComplete, onSkip }: Props) {
  const isCompleted = action.status === "completed";
  const isSkipped = action.status === "skipped";
  const isDone = isCompleted || isSkipped;
  const border = borderColors[action.type] || "border-l-[var(--fp-text-soft)]";

  return (
    <Card
      padding={false}
      className={clsx(
        "border-l-4 overflow-hidden",
        border,
        isCompleted && "bg-[var(--fp-positive)]/10",
        isSkipped && "bg-[var(--fp-surface-elev)]"
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={clsx(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              isDone
                ? isCompleted
                  ? "bg-[var(--fp-positive)]/15 text-[var(--fp-positive)]"
                  : "bg-[var(--fp-surface-elev)] text-[var(--fp-text-muted)]"
                : "bg-[var(--fp-text)]/10 text-[var(--fp-text)]"
            )}
          >
            {isCompleted
              ? "\u2713 Completed"
              : isSkipped
              ? "Skipped"
              : "This Week\u2019s Action"}
          </span>
          {action.target_amount != null && (
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                badgeColors[action.type] || "bg-[var(--fp-surface-elev)] text-[var(--fp-text-muted)]"
              )}
            >
              {fmt(action.target_amount)}
            </span>
          )}
        </div>

        <h3 className="text-2xl font-semibold tracking-tight text-[var(--fp-text)]">{action.title}</h3>

        {action.detail && (
          <p className="mt-2 text-sm leading-relaxed text-[var(--fp-text-muted)]">
            {action.detail}
          </p>
        )}

        {!isDone && (
          <div className="mt-6 flex gap-3">
            <Button
              size="lg"
              onClick={onComplete}
              disabled={completing}
            >
              {completing ? "Saving\u2026" : "Mark Complete"}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={onSkip}
              disabled={completing}
            >
              Skip This Week
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
