import { Progress } from "@/components/ui/progress";
import { formatINR } from "@/lib/money";
import { budgetStatus } from "@/lib/queries/budgets";
import { cn } from "@/lib/utils";

interface BudgetProgressProps {
  label: string;
  spentPaise: number;
  budgetPaise: number;
}

/** Fill gradients per usage band — green while healthy, coral once over. */
const STATUS_FILL: Record<string, string> = {
  normal:
    "[&>div]:bg-[image:linear-gradient(90deg,oklch(0.78_0.14_170),oklch(0.68_0.15_150))]",
  warning:
    "[&>div]:bg-[image:linear-gradient(90deg,oklch(0.85_0.13_95),oklch(0.78_0.15_72))]",
  high: "[&>div]:bg-[image:linear-gradient(90deg,oklch(0.8_0.15_60),oklch(0.7_0.18_40))]",
  exceeded:
    "[&>div]:bg-[image:linear-gradient(90deg,oklch(0.72_0.18_25),oklch(0.62_0.2_12))]",
};

const STATUS_TEXT: Record<string, string> = {
  normal: "text-[var(--success)]",
  warning: "text-[var(--warning)]",
  high: "text-[var(--warning)]",
  exceeded: "text-destructive",
};

export function BudgetProgress({ label, spentPaise, budgetPaise }: BudgetProgressProps) {
  const status = budgetStatus(spentPaise, budgetPaise);
  const rawPct = (spentPaise / budgetPaise) * 100;
  const pct = Math.min(rawPct, 100);
  const remaining = budgetPaise - spentPaise;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        {label && <p className="text-sm font-medium">{label}</p>}
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatINR(spentPaise)} / {formatINR(budgetPaise)}
        </p>
        <p className={cn("text-sm font-semibold tabular-nums", STATUS_TEXT[status])}>
          {Math.round(rawPct)}%
        </p>
      </div>

      <Progress value={pct} className={cn(STATUS_FILL[status])} />

      <p
        className={cn(
          "text-xs",
          status === "exceeded" ? "font-medium text-destructive" : "text-muted-foreground"
        )}
      >
        {status === "exceeded"
          ? `Budget exceeded by ${formatINR(Math.abs(remaining))}`
          : `${formatINR(remaining)} remaining`}
      </p>
    </div>
  );
}
