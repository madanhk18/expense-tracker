import { listRecurringExpenses } from "@/lib/queries/recurring";
import { getExpenseCategories } from "@/lib/queries/categories";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { RecurringList } from "@/components/recurring/recurring-list";
import { PageHeader } from "@/components/shared/page-header";

export default async function RecurringPage() {
  const [items, categories] = await Promise.all([listRecurringExpenses(), getExpenseCategories()]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Recurring"
        description="Subscriptions, rent and bills that repeat on their own."
        actions={<RecurringForm categories={categories} />}
      />
      <RecurringList items={items} />
    </div>
  );
}
