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
  pay_credit_card: "border-l-red-500",
  fund_goal: "border-l-brand-500",
  reduce_spending: "border-l-amber-500",
  build_emergency_fund: "border-l-green-500",
  review_transactions: "border-l-gray-400",
};

const badgeColors: Record<string, string> = {
  pay_credit_card: "bg-red-50 text-red-700",
  fund_goal: "bg-blue-50 text-brand-700",
  reduce_spending: "bg-amber-50 text-amber-700",
  build_emergency_fund: "bg-green-50 text-green-700",
  review_transactions: "bg-gray-50 text-gray-700",
};

const fmt = (n: number) =>
  n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function WeeklyAction({ action, completing, onComplete, onSkip }: Props) {
  const isCompleted = action.status === "completed";
  const isSkipped = action.status === "skipped";
  const isDone = isCompleted || isSkipped;
  const border = borderColors[action.type] || "border-l-gray-400";

  return (
    <Card
      padding={false}
      className={clsx(
        "border-l-4 overflow-hidden",
        border,
        isCompleted && "bg-green-50/50",
        isSkipped && "bg-gray-50/50"
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={clsx(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              isDone
                ? isCompleted
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
                : "bg-brand-50 text-brand-700"
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
                badgeColors[action.type] || "bg-gray-50 text-gray-700"
              )}
            >
              {fmt(action.target_amount)}
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-900">{action.title}</h3>

        {action.detail && (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
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
