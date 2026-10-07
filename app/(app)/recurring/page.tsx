import { listRecurringExpenses } from "@/lib/queries/recurring";
import { getExpenseCategories } from "@/lib/queries/categories";
import { RecurringForm } from "@/components/recurring/recurring-form";
import { RecurringList } from "@/components/recurring/recurring-list";
import { PageHeader } from "@/components/shared/page-header";
import { getPreferences } from "@/lib/queries/preferences";

export default async function RecurringPage() {
  const [items, categories, preferences] = await Promise.all([
    listRecurringExpenses(),
    getExpenseCategories(),
    getPreferences(),
  ]);
  const days = preferences.billReminderDays;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Bills & recurring"
        description={`Rent, subscriptions and bills that repeat. Anything due within ${days} ${days === 1 ? "day" : "days"} shows on your dashboard.`}
        actions={<RecurringForm categories={categories} />}
      />
      <RecurringList items={items} />
    </div>
  );
}
