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
      <CardValue className={netWorth >= 0 ? "text-gray-900" : "text-red-600"}>{fmt(netWorth)}</CardValue>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Assets</p>
          <p className="font-medium text-green-600">{fmt(assets)}</p>
        </div>
        <div>
          <p className="text-gray-500">Liabilities</p>
          <p className="font-medium text-red-600">{fmt(liabilities)}</p>
        </div>
      </div>
    </Card>
  );
}
