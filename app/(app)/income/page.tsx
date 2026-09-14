import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { listIncome, getIncomeStats } from "@/lib/queries/income";
import { getIncomeCategories } from "@/lib/queries/categories";
import { formatINR } from "@/lib/money";
import { monthLabel } from "@/lib/dates";
import { IncomeList } from "@/components/income/income-list";
import { AddIncomeDialog } from "@/components/income/add-income-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { GlassCard } from "@/components/shared/glass-card";
import { GlassIcon } from "@/components/shared/glass-icon";
import { SavingsRateCard } from "@/components/dashboard/savings-rate-card";
import { IncomeSetupNotice } from "@/components/income/income-setup-notice";
import { CardContent } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function IncomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  // Before 0002_income.sql has been run there is no income table yet, so the
  // page explains that instead of throwing.
  const [listed, categories, stats] = await Promise.all([
    listIncome({ page, pageSize: 50, sort: "newest" }).catch(() => null),
    getIncomeCategories().catch(() => []),
    getIncomeStats(),
  ]);

  if (!listed) return <IncomeSetupNotice />;

  const { income, total } = listed;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Income"
        description={`${total} ${total === 1 ? "entry" : "entries"} logged`}
        actions={
          <div className="hidden md:block">
            <AddIncomeDialog categories={categories} />
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5 lg:order-1">
          <div className="md:hidden">
            <AddIncomeDialog
              categories={categories}
              trigger={
                <button className="gradient-income flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold">
                  <Wallet className="size-4" />
                  Add income
                </button>
              }
            />
          </div>
          <IncomeList income={income} categories={categories} />
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <GlassCard tint="var(--success)" size="sm">
              <CardContent className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium tracking-wide text-foreground/70">
                    Earned in {monthLabel(new Date())}
                  </p>
                  <GlassIcon
                    icon={TrendingUp}
                    color="var(--success)"
                    size="sm"
                  />
                </div>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatINR(stats.monthIncomePaise)}
                </p>
                <p className="text-xs text-foreground/65">
                  Last month {formatINR(stats.previousMonthIncomePaise)}
                </p>
              </CardContent>
            </GlassCard>

            <GlassCard tint="var(--chart-4)" size="sm">
              <CardContent className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium tracking-wide text-foreground/70">
                    Spent this month
                  </p>
                  <GlassIcon
                    icon={TrendingDown}
                    color="var(--chart-4)"
                    size="sm"
                  />
                </div>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatINR(stats.monthExpensePaise)}
                </p>
                <p className="text-xs text-foreground/65">
                  {formatINR(
                    Math.max(
                      0,
                      stats.monthIncomePaise - stats.monthExpensePaise,
                    ),
                  )}{" "}
                  kept
                </p>
              </CardContent>
            </GlassCard>
          </div>

          <SavingsRateCard stats={stats} />
        </aside>
      </div>
    </div>
  );
}
