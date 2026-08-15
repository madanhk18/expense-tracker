import { subDays } from "date-fns";
import { listExpenses } from "@/lib/queries/expenses";
import { getCategories } from "@/lib/queries/categories";
import { todayRange, thisWeekRange, monthRange, previousMonthRange } from "@/lib/dates";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseList } from "@/components/expenses/expense-list";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { AddExpenseFab } from "@/components/expenses/add-expense-fab";
import { ExportButtons } from "@/components/expenses/export-buttons";
import { ImportDialog } from "@/components/expenses/import-dialog";
import { Button } from "@/components/ui/button";
import type { ExpenseFilters as ExpenseFiltersInput } from "@/lib/queries/expenses";

function resolveDateRange(preset: string | undefined) {
  const now = new Date();
  switch (preset) {
    case "today":
      return todayRange(now);
    case "yesterday": {
      const y = subDays(now, 1);
      return todayRange(y);
    }
    case "this_week":
      return thisWeekRange(now);
    case "this_month":
      return monthRange(now);
    case "last_month":
      return previousMonthRange(now);
    default:
      return null;
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = resolveDateRange(typeof params.range === "string" ? params.range : undefined);
  const page = Number(params.page) || 1;

  const filters: ExpenseFiltersInput = {
    search: typeof params.q === "string" ? params.q : undefined,
    categoryId: typeof params.category === "string" ? params.category : undefined,
    paymentMethod: typeof params.payment === "string" ? (params.payment as ExpenseFiltersInput["paymentMethod"]) : undefined,
    dateFrom: range?.start.toISOString(),
    dateTo: range?.end.toISOString(),
    sort: (typeof params.sort === "string" ? params.sort : "newest") as ExpenseFiltersInput["sort"],
    page,
    pageSize: 50,
  };

  const [{ expenses, total }, categories] = await Promise.all([listExpenses(filters), getCategories()]);
  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Expenses</h1>
        <div className="flex items-center gap-2">
          <ImportDialog />
          <ExportButtons />
          <div className="hidden md:block">
            <AddExpenseDialog categories={categories} />
          </div>
        </div>
      </div>

      <ExpenseFilters categories={categories} />
      <ExpenseList expenses={expenses} categories={categories} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} expenses
          </p>
          <div className="flex gap-2">
            <PageLink params={params} page={page - 1} disabled={page <= 1} label="Previous" />
            <PageLink params={params} page={page + 1} disabled={page >= totalPages} label="Next" />
          </div>
        </div>
      )}

      <AddExpenseFab categories={categories} />
    </div>
  );
}

function PageLink({
  params,
  page,
  disabled,
  label,
}: {
  params: Record<string, string | string[] | undefined>;
  page: number;
  disabled: boolean;
  label: string;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || typeof value !== "string") continue;
    query.set(key, value);
  }
  query.set("page", String(page));

  return (
    <Button variant="outline" size="sm" disabled={disabled} asChild={!disabled}>
      {disabled ? label : <a href={`?${query.toString()}`}>{label}</a>}
    </Button>
  );
}
