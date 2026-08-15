import Link from "next/link";
import { Receipt } from "lucide-react";
import { getDashboardStats, momChangePercent } from "@/lib/queries/dashboard";
import { getRecentExpenses } from "@/lib/queries/expenses";
import { getCategories } from "@/lib/queries/categories";
import { getOverallBudget } from "@/lib/queries/budgets";
import { getAnalytics } from "@/lib/queries/analytics";
import { monthRange } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { StatCard } from "@/components/dashboard/stat-card";
import { SpendSummary } from "@/components/dashboard/spend-summary";
import { BudgetProgress } from "@/components/budgets/budget-progress";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { AddExpenseFab } from "@/components/expenses/add-expense-fab";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const now = new Date();
  const { start, end } = monthRange(now);

  const [stats, recentExpenses, categories, overallBudget, monthAnalytics] = await Promise.all([
    getDashboardStats(now),
    getRecentExpenses(6),
    getCategories(),
    getOverallBudget(now),
    getAnalytics(start, end),
  ]);

  const percentChange = momChangePercent(stats.monthPaise, stats.previousMonthPaise);
  const topCategories = monthAnalytics.categoryBreakdown.slice(0, 4);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <div className="hidden md:block">
          <AddExpenseDialog categories={categories} />
        </div>
      </div>

      <SpendSummary monthPaise={stats.monthPaise} percentChange={percentChange} greeting={greeting()} monthRef={now} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Today" value={formatINR(stats.todayPaise)} />
        <StatCard label="This week" value={formatINR(stats.weekPaise)} />
        <StatCard label="Avg per day" value={formatINR(stats.avgDailyPaise)} />
        <StatCard label="Highest expense" value={formatINR(stats.highestExpensePaise)} />
      </div>

      {overallBudget && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <BudgetProgress label="" spentPaise={stats.monthPaise} budgetPaise={overallBudget.amount_paise} />
          </CardContent>
        </Card>
      )}

      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCategories.map((cat) => (
              <div key={cat.categoryId} className="flex items-center justify-between text-sm">
                <span>{cat.name}</span>
                <span className="font-medium tabular-nums">{formatINR(cat.paise)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Expenses</CardTitle>
          <Link href="/expenses" className="text-sm text-muted-foreground hover:underline">
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
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{expense.description}</span>
                    {expense.category && (
                      <Badge variant="secondary" className="font-normal">
                        {expense.category.name}
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium tabular-nums">{formatINR(expense.amount_paise)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddExpenseFab categories={categories} />
    </div>
  );
}
