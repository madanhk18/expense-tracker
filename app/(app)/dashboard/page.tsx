import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  Flame,
  History,
  Layers,
  Receipt,
  Target,
  TrendingUp,
} from "lucide-react";
import { getDashboardStats, momChangePercent } from "@/lib/queries/dashboard";
import { getRecentExpenses } from "@/lib/queries/expenses";
import { getExpenseCategories } from "@/lib/queries/categories";
import { getGreetingName } from "@/lib/queries/profile";
import { getIncomeStats } from "@/lib/queries/income";
import { getOverallBudget } from "@/lib/queries/budgets";
import { getAnalytics } from "@/lib/queries/analytics";
import { listUpcomingBills } from "@/lib/queries/recurring";
import { monthRange, formatTime } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { StatCard } from "@/components/dashboard/stat-card";
import { SpendSummary } from "@/components/dashboard/spend-summary";
import { SavingsRateCard } from "@/components/dashboard/savings-rate-card";
import { BillRemindersBanner } from "@/components/dashboard/bill-reminders-banner";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Panel } from "@/components/shared/panel";
import { CategoryIcon } from "@/components/shared/category-icon";
import { IconChip } from "@/components/shared/icon-chip";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryStyle } from "@/lib/category-style";
import { PageHeader } from "@/components/shared/page-header";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const now = new Date();
  const { start, end } = monthRange(now);

  const [
    stats,
    recentExpenses,
    categories,
    overallBudget,
    monthAnalytics,
    upcomingBills,
    name,
    incomeStats,
  ] = await Promise.all([
    getDashboardStats(now),
    getRecentExpenses(6),
    getExpenseCategories(),
    getOverallBudget(now),
    getAnalytics(start, end),
    listUpcomingBills(),
    getGreetingName(),
    getIncomeStats(),
  ]);

  const percentChange = momChangePercent(
    stats.monthPaise,
    stats.previousMonthPaise,
  );
  const topCategories = monthAnalytics.categoryBreakdown.slice(0, 4);
  const topCategoryMax = Math.max(1, ...topCategories.map((c) => c.paise));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Dashboard"
        description="Your spending this month, at a glance."
        actions={
          <div className="hidden md:block">
            <AddExpenseDialog categories={categories} />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SpendSummary
            monthPaise={stats.monthPaise}
            percentChange={percentChange}
            greeting={greeting()}
            name={name}
            monthRef={now}
          />

          <BillRemindersBanner bills={upcomingBills} />

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            <StatCard
              label="Today"
              value={formatINR(stats.todayPaise)}
              tint="var(--chart-3)"
              icon={CalendarDays}
            />
            <StatCard
              label="This week"
              value={formatINR(stats.weekPaise)}
              tint="var(--chart-2)"
              icon={CalendarRange}
            />
            <StatCard
              label="Avg per day"
              value={formatINR(stats.avgDailyPaise, { decimals: false })}
              tint="var(--cat-healthcare)"
              icon={TrendingUp}
            />
            <StatCard
              label="Highest expense"
              value={formatINR(stats.highestExpensePaise)}
              tint="var(--chart-4)"
              icon={Flame}
            />
          </div>

          {overallBudget && (
            <Panel>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <IconChip
                    icon={Target}
                    color="var(--cat-healthcare)"
                    size="sm"
                  />
                  Monthly Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BudgetProgress
                  label=""
                  spentPaise={stats.monthPaise}
                  budgetPaise={overallBudget.amount_paise}
                />
              </CardContent>
            </Panel>
          )}
        </div>

        <div className="space-y-5">
          <SavingsRateCard stats={incomeStats} />

          {topCategories.length > 0 && (
            <Panel>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <IconChip
                    icon={Layers}
                    color="var(--cat-shopping)"
                    size="sm"
                  />
                  Top Categories
                </CardTitle>
                <Link
                  href="/analytics"
                  className="text-sm text-primary hover:underline"
                >
                  View all
                </Link>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {topCategories.map((cat) => {
                  const { color } = categoryStyle(cat.name);
                  return (
                    <div
                      key={cat.categoryId}
                      className="flex items-center gap-3"
                    >
                      <CategoryIcon name={cat.name} size="md" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-medium">
                            {cat.name}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatINR(cat.paise)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(6, (cat.paise / topCategoryMax) * 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Panel>
          )}

          <Panel>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <IconChip icon={History} color="var(--chart-2)" size="sm" />
                Recent Expenses
              </CardTitle>
              <Link
                href="/expenses"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {recentExpenses.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No expenses yet"
                  description="Start tracking your spending today."
                  action={<AddExpenseDialog categories={categories} />}
                />
              ) : (
                <div className="space-y-1">
                  {recentExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted"
                    >
                      <CategoryIcon
                        name={expense.category?.name}
                        icon={expense.category?.icon}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {expense.description}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[expense.category?.name, expense.payment_method]
                            .filter(Boolean)
                            .join(" · ")}
                          {" · "}
                          {formatTime(new Date(expense.expense_at))}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatINR(expense.amount_paise)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Panel>
        </div>
      </div>
    </div>
  );
}
