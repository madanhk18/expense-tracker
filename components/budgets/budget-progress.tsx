import { Progress } from "@/components/ui/progress";
import { formatINR } from "@/lib/money";
import { budgetStatus } from "@/lib/queries/budgets";
import { cn } from "@/lib/utils";

interface BudgetProgressProps {
  label: string;
  spentPaise: number;
  budgetPaise: number;
}

const STATUS_COLOR: Record<string, string> = {
  normal: "[&>div]:bg-emerald-500",
  warning: "[&>div]:bg-amber-500",
  high: "[&>div]:bg-orange-500",
  exceeded: "[&>div]:bg-destructive",
};

export function BudgetProgress({ label, spentPaise, budgetPaise }: BudgetProgressProps) {
  const status = budgetStatus(spentPaise, budgetPaise);
  const pct = Math.min((spentPaise / budgetPaise) * 100, 100);
  const remaining = budgetPaise - spentPaise;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {formatINR(spentPaise)} / {formatINR(budgetPaise)}
        </p>
      </div>
      <Progress value={pct} className={cn(STATUS_COLOR[status])} />
      <p
        className={cn(
          "text-xs",
          status === "exceeded" ? "text-destructive font-medium" : "text-muted-foreground"
        )}
      >
        {status === "exceeded"
          ? `Budget exceeded by ${formatINR(Math.abs(remaining))}`
          : `${Math.round(pct)}% used · ${formatINR(remaining)} remaining`}
      </p>
    </div>
  );
}
