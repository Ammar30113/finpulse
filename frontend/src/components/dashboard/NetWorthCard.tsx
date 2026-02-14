import { Card, CardTitle, CardValue } from "@/components/ui/Card";

interface Props {
  netWorth: number;
  assets: number;
  liabilities: number;
}

const fmt = (n: number) => n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function NetWorthCard({ netWorth, assets, liabilities }: Props) {
  return (
    <Card>
      <CardTitle>Net Worth</CardTitle>
      <CardValue className={netWorth >= 0 ? "text-[var(--fp-text)]" : "text-[var(--fp-negative)]"}>
        {fmt(netWorth)}
      </CardValue>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[var(--fp-text-muted)]">Assets</p>
          <p className="font-semibold text-[var(--fp-positive)]">{fmt(assets)}</p>
        </div>
        <div>
          <p className="text-[var(--fp-text-muted)]">Liabilities</p>
          <p className="font-semibold text-[var(--fp-negative)]">{fmt(liabilities)}</p>
        </div>
      </div>
    </Card>
  );
}
