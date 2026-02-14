import { Card, CardTitle } from "@/components/ui/Card";
import type { UpcomingBill } from "@/lib/types";

interface Props {
  bills: UpcomingBill[];
}

export function UpcomingBills({ bills }: Props) {
  return (
    <Card>
      <CardTitle>Upcoming Bills</CardTitle>
      {bills.length > 0 ? (
        <ul className="space-y-3">
          {bills.slice(0, 5).map((bill, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-[var(--fp-text)]">{bill.description}</p>
                <p className="text-[var(--fp-text-muted)]">{bill.category} &middot; {bill.due_date}</p>
              </div>
              <span className="font-semibold text-[var(--fp-text)]">
                ${bill.amount.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--fp-text-soft)]">No upcoming bills in the next 30 days</p>
      )}
    </Card>
  );
}
