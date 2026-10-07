import { ArrowDownLeft, ArrowUpRight, HandCoins, PiggyBank, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatINR } from "@/lib/money";
import { monthLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/shared/panel";
import { CardContent } from "@/components/ui/card";
import type { MoneyFlow } from "@/types/domain";

interface Bucket {
  label: string;
  paise: number;
  color: string;
  icon: LucideIcon;
}

/**
 * This month in one line: what came in, and where it went — spent, invested,
 * lent — with what's left. The bar splits the money that came in by bucket.
 */
export function MoneyFlowStrip({ flow, monthRef = new Date() }: { flow: MoneyFlow; monthRef?: Date }) {
  const inflowPaise = flow.earnedPaise + flow.borrowedPaise + flow.repaidToYouPaise;
  const lentOutPaise = flow.lentPaise + flow.repaidByYouPaise;

  const buckets: Bucket[] = [
    { label: "Spent", paise: flow.spentPaise, color: "var(--chart-4)", icon: ArrowUpRight },
    { label: "Invested", paise: flow.investedPaise, color: "var(--cat-groceries)", icon: PiggyBank },
    { label: "Lent / repaid", paise: lentOutPaise, color: "var(--cat-entertainment)", icon: HandCoins },
  ];
  const leftPaise = flow.leftPaise;
  const scale = Math.max(1, inflowPaise, buckets.reduce((s, b) => s + b.paise, 0));

  return (
    <Panel size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {monthLabel(monthRef)} · where it went
          </p>
          <p className="flex items-center gap-1 text-sm">
            <ArrowDownLeft className="size-3.5 text-[var(--success)]" />
            <span className="text-muted-foreground">Came in</span>
            <span className="font-semibold tabular-nums">{formatINR(inflowPaise, { decimals: false })}</span>
          </p>
        </div>

        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {buckets.map((b) =>
            b.paise > 0 ? (
              <div
                key={b.label}
                title={`${b.label} ${formatINR(b.paise)}`}
                className="h-full"
                style={{ width: `${(b.paise / scale) * 100}%`, backgroundColor: b.color }}
              />
            ) : null
          )}
          {leftPaise > 0 && (
            <div
              title={`Left ${formatINR(leftPaise)}`}
              className="h-full"
              style={{ width: `${(leftPaise / scale) * 100}%`, backgroundColor: "var(--success)" }}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {buckets.map((b) => (
            <FlowFigure key={b.label} label={b.label} paise={b.paise} color={b.color} icon={b.icon} />
          ))}
          <FlowFigure
            label={leftPaise < 0 ? "Short by" : "Left"}
            paise={Math.abs(leftPaise)}
            color={leftPaise < 0 ? "var(--destructive)" : "var(--success)"}
            icon={Wallet}
            emphasise
            negative={leftPaise < 0}
          />
        </div>
      </CardContent>
    </Panel>
  );
}

function FlowFigure({
  label,
  paise,
  color,
  icon: Icon,
  emphasise,
  negative,
}: Bucket & { emphasise?: boolean; negative?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        {label}
        <Icon className="size-3 opacity-60" />
      </p>
      <p
        className={cn(
          "truncate text-sm font-semibold tabular-nums",
          emphasise && "text-base",
          negative && "text-destructive"
        )}
      >
        {formatINR(paise, { decimals: false })}
      </p>
    </div>
  );
}
