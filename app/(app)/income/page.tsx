import { subMonths } from "date-fns";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { listIncome, getIncomeStats } from "@/lib/queries/income";
import { getIncomeCategories } from "@/lib/queries/categories";
import { formatINR } from "@/lib/money";
import { monthLabel } from "@/lib/dates";
import { IncomeList } from "@/components/income/income-list";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { IncomeSetupNotice } from "@/components/income/income-setup-notice";
import { MoneyTabs } from "@/components/money/money-tabs";
import { MoneyFlowStrip } from "@/components/money/money-flow-strip";
import { getMoneyFlow } from "@/lib/queries/money-flow";
import { CardContent } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IncomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  // Before 0002_income.sql has been run there is no income table yet, so the
  // page explains that instead of throwing.
  const [listed, categories, stats, flow] = await Promise.all([
    listIncome({ page, pageSize: 50, sort: "newest" }).catch(() => null),
    getIncomeCategories().catch(() => []),
    getIncomeStats(),
    getMoneyFlow(),
  ]);

  if (!listed)
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <MoneyTabs />
        <IncomeSetupNotice />
      </div>
    );

  const { income, total } = listed;
  const incomeChange = stats.monthIncomePaise - stats.previousMonthIncomePaise;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <MoneyTabs />
      <PageHeader
        title="Income"
        description={`${total} ${total === 1 ? "entry" : "entries"} logged`}
        actions={
          <div className="hidden md:block">
            <AddIncomeDialog categories={categories} />
          </div>
        }
      />

      {flow && <MoneyFlowStrip flow={flow} />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5 lg:order-1">
          <div className="md:hidden">
            <AddIncomeDialog
              categories={categories}
              trigger={
                <button className="btn-income flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                  <Wallet className="size-4" />
                  Add income
                </button>
              }
            />
          </div>
          <IncomeList income={income} categories={categories} />
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Panel size="sm">
            <CardContent className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">
                  Earned vs last month
                </p>
                <IconChip
                  icon={incomeChange < 0 ? TrendingDown : TrendingUp}
                  color={incomeChange < 0 ? "var(--chart-4)" : "var(--success)"}
                  size="sm"
                />
              </div>
              <p className="text-2xl font-semibold tabular-nums">
                {incomeChange === 0
                  ? "Same"
                  : `${incomeChange > 0 ? "+" : "−"}${formatINR(Math.abs(incomeChange), { decimals: false })}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatINR(stats.previousMonthIncomePaise, { decimals: false })} in{" "}
                {monthLabel(subMonths(new Date(), 1))}
              </p>
            </CardContent>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
