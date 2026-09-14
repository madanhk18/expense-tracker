import { subDays, parseISO } from "date-fns";
import { listExpenses } from "@/lib/queries/expenses";
import { getExpenseCategories } from "@/lib/queries/categories";
import { todayRange, thisWeekRange, monthRange, previousMonthRange } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { MonthSwitcher } from "@/components/expenses/month-switcher";
import { ExpenseList } from "@/components/expenses/expense-list";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { ExportButtons } from "@/components/expenses/export-buttons";
import { ImportDialog } from "@/components/expenses/import-dialog";
import { Button } from "@/components/ui/button";
import type { ExpenseFilters as ExpenseFiltersInput } from "@/lib/queries/expenses";
import { PageHeader } from "@/components/shared/page-header";

function resolveMonth(monthParam: string | undefined) {
  const ref = monthParam ? parseISO(`${monthParam}-01`) : new Date();
  return Number.isNaN(ref.getTime()) ? new Date() : ref;
}

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
  const monthRef = resolveMonth(typeof params.month === "string" ? params.month : undefined);
  const preset = typeof params.range === "string" ? params.range : undefined;
  // An explicit preset wins; otherwise the list is scoped to the month shown.
  const range = resolveDateRange(preset) ?? monthRange(monthRef);
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

  const [{ expenses, total }, categories] = await Promise.all([listExpenses(filters), getExpenseCategories()]);
  const totalPages = Math.max(1, Math.ceil(total / 50));
  const shownPaise = expenses.reduce((sum, e) => sum + e.amount_paise, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader
        title="Expenses"
        description={`${total} ${total === 1 ? "expense" : "expenses"} matching your filters`}
        actions={
          <>
            <ImportDialog />
            <ExportButtons />
            <div className="hidden md:block">
              <AddExpenseDialog categories={categories} />
            </div>
          </>
        }
      />

      {/* Month browsing plus the month's headline total, the way the
          reference app opens: period first, number second, list third. */}
      <div className="surface rounded-xl px-4 py-5">
        <MonthSwitcher monthRef={monthRef} />
        <p className="mt-4 text-center text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Total expenses
        </p>
        <p className="mt-1 text-center text-4xl font-bold tracking-tight tabular-nums">
          {formatINR(shownPaise)}
        </p>
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
