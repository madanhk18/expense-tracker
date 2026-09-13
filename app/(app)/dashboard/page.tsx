import Link from "next/link";
import { CalendarDays, CalendarRange, Flame, Receipt, TrendingUp } from "lucide-react";
import { getDashboardStats, momChangePercent } from "@/lib/queries/dashboard";
import { getRecentExpenses } from "@/lib/queries/expenses";
import { getCategories } from "@/lib/queries/categories";
import { getOverallBudget } from "@/lib/queries/budgets";
import { getAnalytics } from "@/lib/queries/analytics";
import { listUpcomingBills } from "@/lib/queries/recurring";
import { monthRange, formatTime } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { StatCard } from "@/components/dashboard/stat-card";
import { SpendSummary } from "@/components/dashboard/spend-summary";
import { BillRemindersBanner } from "@/components/dashboard/bill-reminders-banner";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { GlassCard } from "@/components/shared/glass-card";
import { CategoryIcon } from "@/components/shared/category-icon";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryStyle } from "@/lib/category-style";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const now = new Date();
  const { start, end } = monthRange(now);

  const [stats, recentExpenses, categories, overallBudget, monthAnalytics, upcomingBills] = await Promise.all([
    getDashboardStats(now),
    getRecentExpenses(6),
    getCategories(),
    getOverallBudget(now),
    getAnalytics(start, end),
    listUpcomingBills(),
  ]);

  const percentChange = momChangePercent(stats.monthPaise, stats.previousMonthPaise);
  const topCategories = monthAnalytics.categoryBreakdown.slice(0, 4);
  const topCategoryMax = Math.max(1, ...topCategories.map((c) => c.paise));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <div className="hidden md:block">
          <AddExpenseDialog categories={categories} />
        </div>
      </div>

      <SpendSummary monthPaise={stats.monthPaise} percentChange={percentChange} greeting={greeting()} monthRef={now} />

      <BillRemindersBanner bills={upcomingBills} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard label="Today" value={formatINR(stats.todayPaise)} tint="var(--chart-3)" icon={CalendarDays} />
        <StatCard label="This week" value={formatINR(stats.weekPaise)} tint="var(--chart-2)" icon={CalendarRange} />
        <StatCard label="Avg per day" value={formatINR(stats.avgDailyPaise)} tint="var(--cat-healthcare)" icon={TrendingUp} />
        <StatCard label="Highest expense" value={formatINR(stats.highestExpensePaise)} tint="var(--chart-4)" icon={Flame} />
      </div>

      {overallBudget && (
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetProgress label="" spentPaise={stats.monthPaise} budgetPaise={overallBudget.amount_paise} />
          </CardContent>
        </GlassCard>
      )}

      {topCategories.length > 0 && (
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Top Categories</CardTitle>
            <Link href="/analytics" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {topCategories.map((cat) => {
              const { color } = categoryStyle(cat.name);
              return (
                <div key={cat.categoryId} className="flex items-center gap-3">
                  <CategoryIcon name={cat.name} size="md" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{cat.name}</span>
                      <span className="font-semibold tabular-nums">{formatINR(cat.paise)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50 dark:bg-white/10">
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
        </GlassCard>
      )}

      <GlassCard>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Expenses</CardTitle>
          <Link href="/expenses" className="text-sm text-primary hover:underline">
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
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/45 dark:hover:bg-white/8"
                >
                  <CategoryIcon
                    name={expense.category?.name}
                    icon={expense.category?.icon}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{expense.description}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[expense.category?.name, expense.payment_method].filter(Boolean).join(" · ")}
                      {" · "}
                      {formatTime(new Date(expense.expense_at))}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatINR(expense.amount_paise)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </GlassCard>
    </div>
  );
}
