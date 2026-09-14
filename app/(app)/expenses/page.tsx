import { subDays, parseISO } from "date-fns";
import { listExpenses } from "@/lib/queries/expenses";
import { getExpenseCategories } from "@/lib/queries/categories";
import { todayRange, thisWeekRange, monthRange, previousMonthRange, monthLabel } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { MonthSwitcher } from "@/components/expenses/month-switcher";
import { ExpensesSearch } from "@/components/expenses/expenses-search";
import { ViewToggle } from "@/components/expenses/view-toggle";
import { CategoryPieChart } from "@/components/analytics/category-pie-chart";
import { getAnalytics } from "@/lib/queries/analytics";
import { Panel } from "@/components/shared/panel";
import { CardContent } from "@/components/ui/card";
import { ExpenseList } from "@/components/expenses/expense-list";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { Button } from "@/components/ui/button";
import type { ExpenseFilters as ExpenseFiltersInput } from "@/lib/queries/expenses";

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

  const view = params.view === "insights" ? "insights" : "list";
  const [{ expenses, total }, categories, analytics] = await Promise.all([
    listExpenses(filters),
    getExpenseCategories(),
    getAnalytics(range.start, range.end),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / 50));
  const shownPaise = expenses.reduce((sum, e) => sum + e.amount_paise, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Search · month · filter, then the month's total, then the view. */}
      <div className="flex items-center justify-between gap-2">
        <ExpensesSearch />
        <MonthSwitcher monthRef={monthRef} />
        <div className="flex items-center gap-2">
          <ExpenseFilters categories={categories} />
          <div className="hidden md:block">
            <AddExpenseDialog categories={categories} />
          </div>
        </div>
      </div>

      <div className="space-y-5 pt-2 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Total expenses</p>
          <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">{formatINR(shownPaise)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {total} {total === 1 ? "expense" : "expenses"} in {monthLabel(monthRef)}
          </p>
        </div>
        <ViewToggle view={view} />
      </div>

      {view === "list" ? (
        <ExpenseList expenses={expenses} categories={categories} />
      ) : (
        <Panel>
          <CardContent>
            <CategoryPieChart
              data={analytics.categoryBreakdown}
              transactionCount={analytics.transactionCount}
            />
          </CardContent>
        </Panel>
      )}

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
