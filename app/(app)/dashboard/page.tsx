import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  Flame,
  History,
  Layers,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { getDashboardStats, momChangePercent } from "@/lib/queries/dashboard";
import { getRecentExpenses } from "@/lib/queries/expenses";
import { getExpenseCategories } from "@/lib/queries/categories";
import { getGreetingName } from "@/lib/queries/profile";
import { getIncomeStats } from "@/lib/queries/income";
import { getAnalytics } from "@/lib/queries/analytics";
import { listUpcomingBills } from "@/lib/queries/recurring";
import { getPreferences } from "@/lib/queries/preferences";
import { getMoneyFlow } from "@/lib/queries/money-flow";
import { listInvestments, listRecurringInvestments } from "@/lib/queries/investments";
import { listLendingRecords, groupByPerson } from "@/lib/queries/lending";
import { buildHighlights } from "@/lib/highlights";
import { daysUntil } from "@/lib/dates";
import { Highlights } from "@/components/dashboard/highlights";
import { FeatureTiles, TILE_ICONS } from "@/components/dashboard/feature-tiles";
import { WhatsNew } from "@/components/dashboard/whats-new";
import { MoneyFlowStrip } from "@/components/money/money-flow-strip";
import { monthRange, formatTime } from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { StatCard } from "@/components/dashboard/stat-card";
import { SpendSummary } from "@/components/dashboard/spend-summary";
import { SavingsRateCard } from "@/components/dashboard/savings-rate-card";
import { BillRemindersBanner } from "@/components/dashboard/bill-reminders-banner";
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
  const preferences = await getPreferences();
  const { start, end } = monthRange(now);

  const [
    stats,
    recentExpenses,
    categories,
    monthAnalytics,
    upcomingBills,
    name,
    incomeStats,
    flow,
    investments,
    sips,
    lendingRecords,
  ] = await Promise.all([
    getDashboardStats(now),
    getRecentExpenses(6),
    getExpenseCategories(),
    getAnalytics(start, end),
    listUpcomingBills(preferences.billReminderDays),
    getGreetingName(),
    getIncomeStats(),
    getMoneyFlow(now),
    // Savings and lending need 0003_money_flows.sql; without it they drop out.
    listInvestments(100).catch(() => null),
    listRecurringInvestments().catch(() => []),
    listLendingRecords().catch(() => null),
  ]);

  const people = lendingRecords ? groupByPerson(lendingRecords) : null;
  const monthInvestments = (investments ?? []).filter((i) => {
    const at = new Date(i.invested_at);
    return at >= start && at <= end;
  });
  const nextBill = upcomingBills[0]
    ? {
        description: upcomingBills[0].description,
        amountPaise: upcomingBills[0].amountPaise,
        daysUntil: daysUntil(new Date(`${upcomingBills[0].nextDueDate}T00:00:00`)),
      }
    : null;

  const highlights = buildHighlights({
    monthSpentPaise: stats.monthPaise,
    previousMonthSpentPaise: stats.previousMonthPaise,
    categoryBreakdown: monthAnalytics.categoryBreakdown,
    flow,
    monthInvestments: monthInvestments.map((i) => ({ name: i.name, paise: i.amount_paise })),
    hasSips: sips.some((s) => s.is_active),
    people,
    billsDueCount: upcomingBills.length,
    nextBill,
    savingsRatePercent: incomeStats.savingsRatePercent,
  });

  const owedToYou = (people ?? []).reduce((sum, p) => sum + Math.max(0, p.netPaise), 0);
  const youOwe = (people ?? []).reduce((sum, p) => sum + Math.max(0, -p.netPaise), 0);
  const activeSips = sips.filter((s) => s.is_active).length;
  const tiles = [
    {
      href: "/income",
      label: "Earned",
      value: formatINR(incomeStats.monthIncomePaise, { decimals: false }),
      hint: incomeStats.monthIncomePaise > 0 ? "this month" : "Add your salary",
      icon: TILE_ICONS.income,
      color: "var(--success)",
    },
    {
      href: "/savings",
      label: "Invested",
      value: formatINR(flow?.investedPaise ?? 0, { decimals: false }),
      hint: activeSips > 0 ? `${activeSips} SIP${activeSips === 1 ? "" : "s"} running` : "Set up a SIP",
      icon: TILE_ICONS.savings,
      color: "var(--cat-groceries)",
    },
    {
      href: "/lending",
      label: owedToYou >= youOwe ? "To get back" : "You owe",
      value: formatINR(owedToYou >= youOwe ? owedToYou : youOwe, { decimals: false }),
      hint: people && people.length > 0 ? `${people.filter((p) => p.netPaise !== 0).length} people open` : "Track money lent",
      icon: TILE_ICONS.lending,
      color: "var(--cat-entertainment)",
    },
    {
      href: "/recurring",
      label: "Bills due",
      value: String(upcomingBills.length),
      hint: nextBill ? `Next: ${nextBill.description}` : `None in ${preferences.billReminderDays} days`,
      icon: TILE_ICONS.bills,
      color: "var(--warning)",
    },
  ];

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
        description="Your money this month, at a glance."
        actions={
          <div className="hidden md:block">
            <AddExpenseDialog categories={categories} />
          </div>
        }
      />

      <WhatsNew />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <SpendSummary
            monthPaise={stats.monthPaise}
            percentChange={percentChange}
            greeting={greeting()}
            name={name}
            monthRef={now}
          />

          <Highlights items={highlights} />

          <FeatureTiles tiles={tiles} />

          {flow && <MoneyFlowStrip flow={flow} monthRef={now} />}

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
        </div>

        <div className="min-w-0 space-y-5">
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
