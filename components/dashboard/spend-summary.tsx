import { ArrowDown, ArrowUp } from "lucide-react";
import { formatINR } from "@/lib/money";
import { monthLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface SpendSummaryProps {
  monthPaise: number;
  percentChange: number | null;
  greeting: string;
  /** First name to greet by — see lib/queries/profile. */
  name: string;
  monthRef: Date;
}

/**
 * The headline: this month's total, sitting on the page itself rather than in
 * a card, so the number is the first thing the eye lands on.
 */
export function SpendSummary({ monthPaise, percentChange, greeting, name, monthRef }: SpendSummaryProps) {
  const isIncrease = (percentChange ?? 0) > 0;

  return (
    <section className="py-6 text-center">
      <p className="text-sm text-muted-foreground">
        {greeting}, {name}
      </p>
      <p className="mt-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Total spent · {monthLabel(monthRef)}
      </p>
      <p className="mt-1 text-5xl font-bold tracking-tight tabular-nums">{formatINR(monthPaise)}</p>

      {percentChange !== null && (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-sm font-medium",
            isIncrease ? "text-destructive" : "text-[var(--success)]"
          )}
        >
          {isIncrease ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          {Math.abs(Math.round(percentChange))}% vs last month
        </p>
      )}
    </section>
  );
}
