import { groupLabel } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { ExpenseRow } from "./expense-row";
import { EmptyState } from "@/components/shared/empty-state";
import { Receipt } from "lucide-react";
import type { Category, ExpenseWithCategory } from "@/types/domain";

export function ExpenseList({ expenses, categories }: { expenses: ExpenseWithCategory[]; categories: Category[] }) {
  if (expenses.length === 0) {
    return (
      <EmptyState icon={Receipt} title="No expenses found" description="Try adjusting your filters or search term." />
    );
  }

  const groups = new Map<string, ExpenseWithCategory[]>();
  for (const expense of expenses) {
    const label = groupLabel(new Date(expense.expense_at));
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(expense);
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([label, items]) => (
        <div key={label} className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              -{formatINR(items.reduce((sum, e) => sum + e.amount_paise, 0))}
            </p>
          </div>
          <div className="space-y-2">
            {items.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} categories={categories} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
