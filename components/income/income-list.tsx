import { Wallet } from "lucide-react";
import { groupLabel } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { EmptyState } from "@/components/shared/empty-state";
import { IncomeRow } from "./income-row";
import type { Category, IncomeWithCategory } from "@/types/domain";

export function IncomeList({
  income,
  categories,
}: {
  income: IncomeWithCategory[];
  categories: Category[];
}) {
  if (income.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No income logged yet"
        description="Add your salary or any money coming in to see your savings rate."
      />
    );
  }

  const groups = new Map<string, IncomeWithCategory[]>();
  for (const entry of income) {
    const label = groupLabel(new Date(entry.received_at));
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(entry);
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([label, items]) => (
        <div key={label} className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-sm text-[var(--success)] tabular-nums">
              +{formatINR(items.reduce((sum, e) => sum + e.amount_paise, 0))}
            </p>
          </div>
          <div className="surface divide-y divide-border overflow-hidden rounded-xl">
            {items.map((entry) => (
              <IncomeRow key={entry.id} income={entry} categories={categories} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
