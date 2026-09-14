import { notFound } from "next/navigation";
import Link from "next/link";
import { parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listExpenses } from "@/lib/queries/expenses";
import { getAnalytics } from "@/lib/queries/analytics";
import { getCategoryBudgets } from "@/lib/queries/budgets";
import { getExpenseCategories } from "@/lib/queries/categories";
import { monthRange, monthLabel } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { categoryStyle } from "@/lib/category-style";
import { MonthSwitcher } from "@/components/expenses/month-switcher";
import { ExpenseList } from "@/components/expenses/expense-list";
import { CategoryShareRing } from "@/components/analytics/category-share-ring";
import { Panel } from "@/components/shared/panel";
import { CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** One category, one month: its share of the month, its budget, its expenses. */
export default async function CategoryMonthPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const monthParam = typeof sp.month === "string" ? sp.month : undefined;
  const parsed = monthParam ? parseISO(`${monthParam}-01`) : new Date();
  const monthRef = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const { start, end } = monthRange(monthRef);

  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (!category) notFound();

  const [{ expenses }, analytics, budgets, categories] = await Promise.all([
    listExpenses({
      categoryId: id,
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
      pageSize: 100,
    }),
    getAnalytics(start, end),
    getCategoryBudgets(monthRef),
    getExpenseCategories(),
  ]);

  const spentPaise = expenses.reduce((sum, e) => sum + e.amount_paise, 0);
  const budget = budgets.find((b) => b.category_id === id);
  const share = analytics.totalPaise > 0 ? (spentPaise / analytics.totalPaise) * 100 : 0;
  const { color } = categoryStyle(category.name, category.icon);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/analytics"
          aria-label="Back to analytics"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <MonthSwitcher monthRef={monthRef} />
        </div>
        <span className="size-9" />
      </div>

      <Panel>
        <CardContent className="space-y-5">
          <CategoryShareRing
            name={category.name}
            icon={category.icon}
            color={color}
            percent={share}
            label={monthLabel(monthRef)}
          />

          <div className="text-center">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {category.name}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{formatINR(spentPaise)}</p>
          </div>

          <div className="space-y-2 rounded-xl bg-muted px-4 py-3">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Actual spent <strong className="text-foreground">{Math.round(share)}%</strong>
              </span>
              <span className="font-semibold tabular-nums">{formatINR(spentPaise)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Allocated budget</span>
              <span className="font-semibold tabular-nums">
                {budget ? formatINR(budget.amount_paise) : "Not set"}
              </span>
            </div>
          </div>
        </CardContent>
      </Panel>

      <ExpenseList expenses={expenses} categories={categories} />
    </div>
  );
}
