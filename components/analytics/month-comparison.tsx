import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MonthComparisonProps {
  /** Ready-made labels — a month name, or a date range for custom windows. */
  currentLabel: string;
  previousLabel: string;
  currentPaise: number;
  previousPaise: number;
  diffPaise: number;
  percentChange: number | null;
}

export function MonthComparison({ currentLabel, previousLabel, currentPaise, previousPaise, diffPaise, percentChange }: MonthComparisonProps) {
  const isIncrease = diffPaise > 0;
  const isFlat = diffPaise === 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-white/50 bg-white/40 p-3 dark:border-white/10 dark:bg-white/6">
        <p className="text-xs text-muted-foreground">{currentLabel}</p>
        <p className="text-xl font-semibold tabular-nums">{formatINR(currentPaise)}</p>
      </div>
      <div className="rounded-2xl border border-white/50 bg-white/40 p-3 dark:border-white/10 dark:bg-white/6">
        <p className="text-xs text-muted-foreground">{previousLabel}</p>
        <p className="text-xl font-semibold tabular-nums">{formatINR(previousPaise)}</p>
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 border-t border-white/40 pt-3 dark:border-white/10">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/50 px-2.5 py-1 text-sm font-medium dark:border-white/10 dark:bg-white/10",
            isFlat ? "text-muted-foreground" : isIncrease ? "text-destructive" : "text-[var(--success)]"
          )}
        >
          {isFlat ? <Minus className="size-3.5" /> : isIncrease ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          {formatINR(Math.abs(diffPaise))}
        </span>
        <span className="text-sm text-muted-foreground">
          {percentChange === null
            ? "no prior data"
            : `you spent ${Math.abs(Math.round(percentChange))}% ${isIncrease ? "more" : "less"} than the period before`}
        </span>
      </div>
    </div>
  );
}
