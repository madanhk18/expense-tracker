import { ArrowDownLeft, ArrowUpRight, Handshake, Plus } from "lucide-react";
import { listLendingRecords, groupByPerson } from "@/lib/queries/lending";
import { getMoneyFlow } from "@/lib/queries/money-flow";
import { formatINR } from "@/lib/money";
import { MoneyTabs } from "@/components/money/money-tabs";
import { MoneyFlowStrip } from "@/components/money/money-flow-strip";
import { PersonCard } from "@/components/lending/person-card";
import { AddLendingDialog } from "@/components/lending/add-lending-dialog";
import { IncomeSetupNotice } from "@/components/income/income-setup-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { CardContent } from "@/components/ui/card";

export default async function LendingPage() {
  const now = new Date();
  const [records, flow] = await Promise.all([listLendingRecords().catch(() => null), getMoneyFlow(now)]);

  if (!records) {
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

  const people = groupByPerson(records);
  const names = people.map((p) => p.name);
  const owedToYou = people.reduce((sum, p) => sum + p.owedToYouPaise, 0);
  const youOwe = people.reduce((sum, p) => sum + p.youOwePaise, 0);
  const openPeople = people.filter((p) => p.owedToYouPaise + p.youOwePaise > 0);
  const settledPeople = people.filter((p) => p.owedToYouPaise + p.youOwePaise === 0);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <MoneyTabs />
      <PageHeader
        title="Lending"
        description="Money you gave friends or took from them — and what's still to come back."
        actions={
          <div className="hidden md:block">
            <AddLendingDialog people={names} />
          </div>
        }
      />

      {flow && <MoneyFlowStrip flow={flow} monthRef={now} />}

      <div className="grid grid-cols-2 gap-3">
        <Panel size="sm">
          <CardContent className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground">You&apos;ll get back</p>
              <IconChip icon={ArrowDownLeft} color="var(--success)" size="sm" />
            </div>
            <p className="text-2xl font-semibold text-[var(--success)] tabular-nums">
              {formatINR(owedToYou, { decimals: false })}
            </p>
            <p className="text-xs text-muted-foreground">
              from {people.filter((p) => p.owedToYouPaise > 0).length} people
            </p>
          </CardContent>
        </Panel>
        <Panel size="sm">
          <CardContent className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground">You owe</p>
              <IconChip icon={ArrowUpRight} color="var(--destructive)" size="sm" />
            </div>
            <p className="text-2xl font-semibold text-destructive tabular-nums">
              {formatINR(youOwe, { decimals: false })}
            </p>
            <p className="text-xs text-muted-foreground">
              to {people.filter((p) => p.youOwePaise > 0).length} people
            </p>
          </CardContent>
        </Panel>
      </div>

      <div className="md:hidden">
        <AddLendingDialog
          people={names}
          trigger={
            <button className="btn-solid flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold">
              <Plus className="size-4" />
              Gave or took money
            </button>
          }
        />
      </div>

      {people.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No one owes anyone"
          description="Lent a friend ₹500 for dinner? Note it here and never forget who owes what."
          action={<AddLendingDialog people={names} />}
        />
      ) : (
        <div className="space-y-5">
          {openPeople.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-sm font-semibold">Open</p>
              {openPeople.map((person) => (
                <PersonCard key={person.name} person={person} people={names} />
              ))}
            </section>
          )}
          {settledPeople.length > 0 && (
            <section className="space-y-2">
              <p className="px-1 text-sm font-semibold text-muted-foreground">All settled</p>
              {settledPeople.map((person) => (
                <PersonCard key={person.name} person={person} people={names} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
