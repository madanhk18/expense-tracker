import { CalendarClock, PiggyBank, Plus, Repeat, TrendingUp } from "lucide-react";
import { listInvestments, getInvestmentSummary, listRecurringInvestments } from "@/lib/queries/investments";
import { getMoneyFlow } from "@/lib/queries/money-flow";
import { formatINR } from "@/lib/money";
import { monthLabel } from "@/lib/dates";
import { MoneyTabs } from "@/components/money/money-tabs";
import { MoneyFlowStrip } from "@/components/money/money-flow-strip";
import { InvestmentList } from "@/components/savings/investment-list";
import { SipList } from "@/components/savings/sip-list";
import { SavingsMixChart } from "@/components/savings/savings-mix-chart";
import { AddInvestmentDialog, AddSipDialog } from "@/components/savings/savings-dialogs";
import { IncomeSetupNotice } from "@/components/income/income-setup-notice";
import { PageHeader } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SavingsPage() {
  const now = new Date();

  // Before 0003_money_flows.sql has been run there are no tables yet, so the
  // page explains the setup step instead of throwing.
  const [investments, summary, sips, flow] = await Promise.all([
    listInvestments().catch(() => null),
    getInvestmentSummary(now).catch(() => null),
    listRecurringInvestments().catch(() => []),
    getMoneyFlow(now),
  ]);

  if (!investments || !summary) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <MoneyTabs />
        <IncomeSetupNotice
          migration="supabase/migrations/0003_money_flows.sql"
          blurb="Savings and Lending store entries in new tables. Run this migration once and both pages turn on."
        />
      </div>
    );
  }

  const activeSips = sips.filter((s) => s.is_active);
  const monthlySipPaise = activeSips
    .filter((s) => s.frequency === "monthly")
    .reduce((sum, s) => sum + s.amount_paise, 0);
  const change = summary.monthPaise - summary.previousMonthPaise;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <MoneyTabs />
      <PageHeader
        title="Savings"
        description="SIPs, FDs and everything you put aside. None of it counts as spending."
        actions={
          <div className="hidden gap-2 md:flex">
            <AddSipDialog />
            <AddInvestmentDialog />
          </div>
        }
      />

      {flow && <MoneyFlowStrip flow={flow} monthRef={now} />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <AddInvestmentDialog
              trigger={
                <button className="btn-income flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                  <Plus className="size-4" />
                  Add investment
                </button>
              }
            />
            <AddSipDialog
              trigger={
                <button className="field flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
                  <Repeat className="size-4" />
                  Set up SIP
                </button>
              }
            />
          </div>
          <InvestmentList investments={investments} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="grid grid-cols-2 gap-3">
            <Panel size="sm">
              <CardContent className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground">Total saved</p>
                  <IconChip icon={PiggyBank} color="var(--success)" size="sm" />
                </div>
                <p className="text-xl font-semibold tabular-nums">
                  {formatINR(summary.totalPaise, { decimals: false })}
                </p>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Panel>
            <Panel size="sm">
              <CardContent className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground">{monthLabel(now)}</p>
                  <IconChip icon={TrendingUp} color="var(--cat-groceries)" size="sm" />
                </div>
                <p className="text-xl font-semibold tabular-nums">
                  {formatINR(summary.monthPaise, { decimals: false })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {change === 0
                    ? "Same as last month"
                    : `${change > 0 ? "+" : "−"}${formatINR(Math.abs(change), { decimals: false })} vs last month`}
                </p>
              </CardContent>
            </Panel>
          </div>

          <Panel>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-base">
                <IconChip icon={CalendarClock} color="var(--cat-groceries)" size="sm" />
                Repeating SIPs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sips.length === 0 ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Set a SIP once and it logs itself every month — no re-entering.</p>
                  <AddSipDialog />
                </div>
              ) : (
                <>
                  {monthlySipPaise > 0 && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatINR(monthlySipPaise, { decimals: false })}
                      </span>{" "}
                      goes in automatically every month
                    </p>
                  )}
                  <SipList sips={sips} />
                </>
              )}
            </CardContent>
          </Panel>

          {summary.byType.length > 0 && (
            <Panel>
              <CardHeader>
                <CardTitle className="text-base">Your mix</CardTitle>
              </CardHeader>
              <CardContent>
                <SavingsMixChart data={summary.byType} />
              </CardContent>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
