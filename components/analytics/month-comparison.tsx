import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { formatINR } from "@/lib/money";
import { monthLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface MonthComparisonProps {
  currentLabel: Date;
  previousLabel: Date;
  currentPaise: number;
  previousPaise: number;
  diffPaise: number;
  percentChange: number | null;
}

export function MonthComparison({ currentLabel, previousLabel, currentPaise, previousPaise, diffPaise, percentChange }: MonthComparisonProps) {
  const isIncrease = diffPaise > 0;
  const isFlat = diffPaise === 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs text-muted-foreground">{monthLabel(currentLabel)}</p>
        <p className="text-xl font-semibold tabular-nums">{formatINR(currentPaise)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{monthLabel(previousLabel)}</p>
        <p className="text-xl font-semibold tabular-nums">{formatINR(previousPaise)}</p>
      </div>
      <div className="col-span-2 flex items-center gap-2 border-t pt-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium",
            isFlat ? "text-muted-foreground" : isIncrease ? "text-destructive" : "text-emerald-600 dark:text-emerald-500"
          )}
        >
          {isFlat ? <Minus className="size-3.5" /> : isIncrease ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          {formatINR(Math.abs(diffPaise))}
        </span>
        <span className="text-sm text-muted-foreground">
          {percentChange === null
            ? "no prior data"
            : `you spent ${Math.abs(Math.round(percentChange))}% ${isIncrease ? "more" : "less"} than last month`}
        </span>
      </div>
    </div>
  );
}
