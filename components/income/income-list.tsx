import { Wallet } from "lucide-react";
import { groupLabel } from "@/lib/dates";
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
          <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
          <div className="space-y-2">
            {items.map((entry) => (
              <IncomeRow key={entry.id} income={entry} categories={categories} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
