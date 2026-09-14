import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { IncomeStats } from "@/types/domain";

/**
 * Savings rate = (income − spending) ÷ income, for the current month.
 * With no income logged there is no rate to show, so the card invites the
 * user to log some rather than rendering a meaningless 0%.
 */
export function SavingsRateCard({ stats }: { stats: IncomeStats }) {
  const { monthIncomePaise, monthExpensePaise, savingsRatePercent } = stats;

  if (monthIncomePaise === 0) {
    return (
      <Panel>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <IconChip icon={PiggyBank} color="var(--success)" size="sm" />
            Savings rate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Log what you earn this month and you&apos;ll see how much of it you actually keep.
          </p>
          <Link href="/income" className="text-sm font-semibold text-primary hover:underline">
            Add income →
          </Link>
        </CardContent>
      </Panel>
    );
  }

  const keptPaise = monthIncomePaise - monthExpensePaise;
  const rate = savingsRatePercent ?? 0;
  const overspent = keptPaise < 0;
  // The bar shows the share kept; an overspend pins it to empty.
  const barPercent = Math.max(0, Math.min(100, rate));

  return (
    <Panel>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-base">
          <IconChip
            icon={PiggyBank}
            color={overspent ? "var(--destructive)" : "var(--success)"}
            size="sm"
          />
          Savings rate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <p
            className={cn(
              "text-4xl font-bold tracking-tight tabular-nums",
              overspent ? "text-destructive" : "text-[var(--success)]"
            )}
          >
            {Math.round(rate)}%
          </p>
          <p className="pb-1 text-sm text-muted-foreground">
            {overspent
              ? `${formatINR(Math.abs(keptPaise))} over what you earned`
              : `${formatINR(keptPaise)} kept this month`}
          </p>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full border border-border bg-card">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${overspent ? 100 : Math.max(barPercent, 2)}%`,
              backgroundImage: overspent
                ? "linear-gradient(90deg, oklch(0.72 0.18 25), oklch(0.62 0.2 12))"
                : "var(--btn-income)",
            }}
          />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span>Earned {formatINR(monthIncomePaise)}</span>
          <span>Spent {formatINR(monthExpensePaise)}</span>
        </div>
      </CardContent>
    </Panel>
  );
}
