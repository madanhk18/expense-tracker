import { parseISO } from "date-fns";
import { ChartPie, CreditCard, Lightbulb, Scale, Store, TrendingUp, Wallet } from "lucide-react";
import { getAnalytics, getMonthComparison } from "@/lib/queries/analytics";
import { monthRange, previousMonthRange } from "@/lib/dates";
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
  const monthParam = typeof params.month === "string" ? params.month : undefined;
  const fromParam = typeof params.from === "string" ? params.from : undefined;
  const toParam = typeof params.to === "string" ? params.to : undefined;

  const monthRef = monthParam ? parseISO(`${monthParam}-01`) : new Date();
  const isCustomRange = Boolean(fromParam && toParam);

  const { start, end } = isCustomRange
    ? { start: parseISO(fromParam!), end: parseISO(toParam!) }
    : monthRange(monthRef);
  const { start: prevStart, end: prevEnd } = previousMonthRange(monthRef);

  const granularity = end.getTime() - start.getTime() > 1000 * 60 * 60 * 24 * 90 ? "month" : "day";

  const [analytics, comparison, prevAnalytics] = await Promise.all([
    getAnalytics(start, end, granularity),
    isCustomRange ? Promise.resolve(null) : getMonthComparison(start, end, prevStart, prevEnd),
    isCustomRange ? Promise.resolve(null) : getAnalytics(prevStart, prevEnd),
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

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Analytics"
        description="Where your money actually goes."
        actions={<MonthPicker monthRef={monthRef} />}
      />

      <GlassCard tint="var(--chart-1)">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <GlassIcon icon={Wallet} color="var(--chart-1)" size="sm" />
            Total spending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight tabular-nums">{formatINR(analytics.totalPaise)}</p>
          <p className="text-sm text-muted-foreground">{analytics.transactionCount} transactions</p>
        </CardContent>
      </GlassCard>

      {!isCustomRange && comparison && (
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base">
            <GlassIcon icon={Scale} color="var(--chart-2)" size="sm" />
            Month-to-month comparison
          </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthComparison
              currentLabel={monthRef}
              previousLabel={prevStart}
              currentPaise={comparison.currentPaise}
              previousPaise={comparison.previousPaise}
              diffPaise={comparison.diffPaise}
              percentChange={comparison.percentChange}
            />
          </CardContent>
        </GlassCard>
      )}

      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <GlassIcon icon={ChartPie} color="var(--cat-shopping)" size="sm" />
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
            <GlassIcon icon={TrendingUp} color="var(--cat-healthcare)" size="sm" />
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
            <GlassIcon icon={CreditCard} color="var(--cat-subscriptions)" size="sm" />
            Payment methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBarChart
            colorBy="payment"
            data={analytics.paymentMethodBreakdown.map((p) => ({ name: p.method, paise: p.paise }))}
          />
        </CardContent>
      </GlassCard>

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
                <span className="font-medium tabular-nums">{formatINR(m.paise)}</span>
              </div>
            ))}
          </CardContent>
        </GlassCard>
      )}

      {insights.length > 0 && (
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base">
            <GlassIcon icon={Lightbulb} color="var(--warning)" size="sm" />
            Insights
          </CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsList insights={insights} />
          </CardContent>
        </GlassCard>
      )}
    </div>
  );
}
