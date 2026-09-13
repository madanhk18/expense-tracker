import { ArrowDown, ArrowUp, Wallet } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/shared/glass-card";
import { GlassIcon } from "@/components/shared/glass-icon";
import { formatINR } from "@/lib/money";
import { monthLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface SpendSummaryProps {
  monthPaise: number;
  percentChange: number | null;
  greeting: string;
  monthRef: Date;
}

/** The hero card: this month's total, and how it compares with last month. */
export function SpendSummary({ monthPaise, percentChange, greeting, monthRef }: SpendSummaryProps) {
  const isIncrease = (percentChange ?? 0) > 0;

  return (
    <GlassCard tint="var(--chart-1)" className="glass-hover">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-foreground/75">{greeting} 👋</p>
            <p className="mt-0.5 text-xs font-medium tracking-wide text-foreground/60 uppercase">
              {monthLabel(monthRef)}
            </p>
          </div>
          <GlassIcon icon={Wallet} color="var(--chart-1)" size="lg" />
        </div>

        <div>
          <p className="text-xs font-medium tracking-wide text-foreground/70">Total spent</p>
          <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
            {formatINR(monthPaise)}
          </p>
        </div>

        {percentChange !== null && (
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/50 px-2.5 py-1 text-sm font-medium backdrop-blur-sm dark:border-white/10 dark:bg-white/10",
              isIncrease ? "text-destructive" : "text-[var(--success)]"
            )}
          >
            {isIncrease ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
            {Math.abs(Math.round(percentChange))}% vs last month
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
