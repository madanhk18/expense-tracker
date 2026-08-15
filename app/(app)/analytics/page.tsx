import { parseISO } from "date-fns";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <MonthPicker monthRef={monthRef} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total spending</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{formatINR(analytics.totalPaise)}</p>
          <p className="text-sm text-muted-foreground">{analytics.transactionCount} transactions</p>
        </CardContent>
      </Card>

      {!isCustomRange && comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Month-to-month comparison</CardTitle>
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
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CategoryPieChart data={analytics.categoryBreakdown} />
          <CategoryBarChart data={analytics.categoryBreakdown} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending over time</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendLineChart data={analytics.series} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment methods</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBarChart data={analytics.paymentMethodBreakdown.map((p) => ({ name: p.method, paise: p.paise }))} />
        </CardContent>
      </Card>

      {analytics.topMerchants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top merchants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.topMerchants.map((m) => (
              <div key={m.merchant} className="flex items-center justify-between text-sm">
                <span>{m.merchant}</span>
                <span className="font-medium tabular-nums">{formatINR(m.paise)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsList insights={insights} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
