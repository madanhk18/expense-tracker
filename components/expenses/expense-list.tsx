import { groupLabel } from "@/lib/dates";
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
    <div className="space-y-6">
      {[...groups.entries()].map(([label, items]) => (
        <div key={label}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="divide-y">
            {items.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} categories={categories} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
