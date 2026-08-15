import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/money";
import { monthLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface SpendSummaryProps {
  monthPaise: number;
  percentChange: number | null;
  greeting: string;
  monthRef: Date;
}

export function SpendSummary({ monthPaise, percentChange, greeting, monthRef }: SpendSummaryProps) {
  const isIncrease = (percentChange ?? 0) > 0;

  return (
    <Card>
      <CardContent className="space-y-3 py-2">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{monthLabel(monthRef)}</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">{formatINR(monthPaise)}</p>
        </div>
        {percentChange !== null && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium",
              isIncrease ? "text-destructive" : "text-emerald-600 dark:text-emerald-500"
            )}
          >
            {isIncrease ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
            {Math.abs(Math.round(percentChange))}% vs last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}
