import { listRecurringExpenses } from "@/lib/queries/recurring";
import { getCategories } from "@/lib/queries/categories";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { RecurringList } from "@/components/recurring/recurring-list";

export default async function RecurringPage() {
  const [items, categories] = await Promise.all([listRecurringExpenses(), getCategories()]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Recurring Expenses</h1>
        <RecurringForm categories={categories} />
      </div>
      <RecurringList items={items} />
    </div>
  );
}
