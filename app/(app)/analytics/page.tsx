import { parseISO } from "date-fns";
import {
  ChartPie,
  CreditCard,
  Lightbulb,
  Scale,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getAnalytics, getMonthComparison } from "@/lib/queries/analytics";
import {
  monthRange,
  previousMonthRange,
  customRange,
  precedingRange,
  rangeDays,
  rangeLabel,
  monthLabel,
} from "@/lib/dates";
import { formatINR } from "@/lib/money";
import { buildInsights } from "@/lib/insights";
import { MonthPicker } from "@/components/analytics/month-picker";
import { CategoryPieChart } from "@/components/analytics/category-pie-chart";
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { SpendLineChart } from "@/components/analytics/spend-line-chart";
import { MonthComparison } from "@/components/analytics/month-comparison";
import { InsightsList } from "@/components/analytics/insights-list";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/shared/glass-card";
import { GlassIcon } from "@/components/shared/glass-icon";
import { PageHeader } from "@/components/shared/page-header";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const monthParam =
    typeof params.month === "string" ? params.month : undefined;
  const fromParam = typeof params.from === "string" ? params.from : undefined;
  const toParam = typeof params.to === "string" ? params.to : undefined;

  const monthRef = monthParam ? parseISO(`${monthParam}-01`) : new Date();

  // A custom range covers whole days: "to 13 Sep" has to include everything
  // spent on 13 Sep, so the end is the end of that day (see lib/dates).
  const custom = customRange(fromParam, toParam);
  const isCustomRange = custom !== null;
  const { start, end } = custom ?? monthRange(monthRef);

  // Compare a month against last month, and a custom range against the window
  // of the same length immediately before it.
  const { start: prevStart, end: prevEnd } = isCustomRange
    ? precedingRange(start, end)
    : previousMonthRange(monthRef);

  const days = rangeDays(start, end);
  const granularity = days > 90 ? "month" : days > 31 ? "week" : "day";

  const [analytics, comparison, prevAnalytics] = await Promise.all([
    getAnalytics(start, end, granularity),
    getMonthComparison(start, end, prevStart, prevEnd),
    getAnalytics(prevStart, prevEnd),
  ]);

  const insights = !isCustomRange
    ? buildInsights({
        monthPaise: analytics.totalPaise,
        previousMonthPaise: comparison?.previousPaise ?? 0,
        avgDailyPaise: Math.round(analytics.totalPaise / new Date().getDate()),
        highestExpensePaise: 0,
        categoryBreakdown: analytics.categoryBreakdown,
        previousCategoryBreakdown: prevAnalytics?.categoryBreakdown ?? [],
        rows: [],
      })
    : [];

  const avgPerDay = days > 0 ? Math.round(analytics.totalPaise / days) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <PageHeader
        title="Analytics"
        description={`${isCustomRange ? rangeLabel(start, end) : monthLabel(start)} · ${days} ${
          days === 1 ? "day" : "days"
        }`}
        actions={<MonthPicker monthRef={monthRef} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <GlassCard tint="var(--chart-1)">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-base">
                <GlassIcon icon={Wallet} color="var(--chart-1)" size="sm" />
                Total spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs font-medium tracking-wide text-foreground/70 uppercase">
                {isCustomRange ? rangeLabel(start, end) : monthLabel(start)}
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
                {formatINR(analytics.totalPaise)}
              </p>
              <p className="mt-1 text-sm text-foreground/70">
                {analytics.transactionCount}{" "}
                {analytics.transactionCount === 1
                  ? "transaction"
                  : "transactions"}{" "}
                · {formatINR(avgPerDay, { decimals: false })}/day
              </p>
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-base">
                <GlassIcon
                  icon={ChartPie}
                  color="var(--cat-shopping)"
                  size="sm"
                />
                Category breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <CategoryPieChart data={analytics.categoryBreakdown} />
              <CategoryBarChart data={analytics.categoryBreakdown} />
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-base">
                <GlassIcon
                  icon={TrendingUp}
                  color="var(--cat-healthcare)"
                  size="sm"
                />
                Spending over time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SpendLineChart data={analytics.series} />
            </CardContent>
          </GlassCard>

          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-base">
                <GlassIcon
                  icon={CreditCard}
                  color="var(--cat-subscriptions)"
                  size="sm"
                />
                Payment methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryBarChart
                colorBy="payment"
                data={analytics.paymentMethodBreakdown.map((p) => ({
                  name: p.method,
                  paise: p.paise,
                }))}
              />
            </CardContent>
          </GlassCard>
        </div>

        <div className="space-y-4">
          {comparison && (
            <GlassCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <GlassIcon icon={Scale} color="var(--chart-2)" size="sm" />
                  {isCustomRange
                    ? "Vs the previous period"
                    : "Month-to-month comparison"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MonthComparison
                  currentLabel={
                    isCustomRange ? rangeLabel(start, end) : monthLabel(start)
                  }
                  previousLabel={
                    isCustomRange
                      ? rangeLabel(prevStart, prevEnd)
                      : monthLabel(prevStart)
                  }
                  currentPaise={comparison.currentPaise}
                  previousPaise={comparison.previousPaise}
                  diffPaise={comparison.diffPaise}
                  percentChange={comparison.percentChange}
                />
              </CardContent>
            </GlassCard>
          )}

          {analytics.topMerchants.length > 0 && (
            <GlassCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <GlassIcon icon={Store} color="var(--cat-food)" size="sm" />
                  Top merchants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.topMerchants.map((m) => (
                  <div
                    key={m.merchant}
                    className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-white/45 dark:hover:bg-white/8"
                  >
                    <span className="truncate">{m.merchant}</span>
                    <span className="font-medium tabular-nums">
                      {formatINR(m.paise)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </GlassCard>
          )}

          {insights.length > 0 && (
            <GlassCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5 text-base">
                  <GlassIcon
                    icon={Lightbulb}
                    color="var(--warning)"
                    size="sm"
                  />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InsightsList insights={insights} />
              </CardContent>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
