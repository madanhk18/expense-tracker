import Link from "next/link";
import { ArrowRight, CalendarDays, CalendarOff, Coffee, Crown, type LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { CategoryIcon } from "@/components/shared/category-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpenseInsights } from "@/lib/expense-insights";

const LEVEL_MIX = [0, 22, 45, 70, 100]; // % of the accent colour per heat level

/**
 * Expenses → Insights: how you spend day to day. Deliberately different from
 * Analytics (which is about *where* money goes): a heat calendar, no-spend
 * days, small-spend leaks, weekday habits and the month's biggest hits.
 */
export function ExpenseInsightsView({ insights, monthKey }: { insights: ExpenseInsights; monthKey: string }) {
  if (insights.count === 0) {
    return <EmptyState icon={CalendarDays} title="Nothing spent this month" description="Insights appear once you add expenses." />;
  }

  const maxWeekday = Math.max(1, ...insights.weekdays.map((w) => w.paise));
  const smallShare = insights.totalPaise > 0 ? Math.round((insights.smallSpends.paise / insights.totalPaise) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Heat calendar */}
      <Panel>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5 text-base">
            <IconChip icon={CalendarDays} color="var(--chart-4)" size="sm" />
            Your month, day by day
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="pb-1 text-[11px] font-medium text-muted-foreground">
                {d}
              </span>
            ))}
            {Array.from({ length: insights.calendarOffset }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {insights.calendar.map((day) => (
              <div
                key={day.date}
                title={day.future ? undefined : `${format(new Date(`${day.date}T00:00:00`), "d MMM")}: ${formatINR(day.paise)}${day.count ? ` · ${day.count} expense${day.count === 1 ? "" : "s"}` : ""}`}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-medium",
                  day.future && "opacity-35",
                  day.level >= 3 ? "text-white" : "text-foreground"
                )}
                style={{
                  backgroundColor:
                    day.level === 0
                      ? "var(--muted)"
                      : `color-mix(in oklch, var(--chart-4) ${LEVEL_MIX[day.level]}%, var(--card))`,
                }}
              >
                {day.day}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
            Less
            {LEVEL_MIX.map((mix, i) => (
              <span
                key={i}
                className="size-3 rounded"
                style={{ backgroundColor: i === 0 ? "var(--muted)" : `color-mix(in oklch, var(--chart-4) ${mix}%, var(--card))` }}
              />
            ))}
            More
          </div>
        </CardContent>
      </Panel>

      {/* Habits */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Fact
          icon={CalendarOff}
          color="var(--success)"
          label="No-spend days"
          value={`${insights.noSpendDays} of ${insights.daysElapsed}`}
          hint={insights.noSpendStreak > 0 ? `${insights.noSpendStreak}-day streak going` : "Days you spent nothing"}
        />
        <Fact
          icon={Coffee}
          color="var(--cat-food)"
          label={`Small spends (under ${formatINR(insights.smallSpends.thresholdPaise, { decimals: false })})`}
          value={formatINR(insights.smallSpends.paise, { decimals: false })}
          hint={`${insights.smallSpends.count} of them · ${smallShare}% of the month`}
        />
        <Fact
          icon={CalendarDays}
          color="var(--chart-1)"
          label="You spend most on"
          value={insights.busiestWeekday ? `${insights.busiestWeekday}days` : "—"}
          hint="Across this month"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekday rhythm */}
        <Panel>
          <CardHeader>
            <CardTitle className="text-base">By day of the week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-36 items-end gap-2">
              {insights.weekdays.map((w) => (
                <div key={w.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      title={formatINR(w.paise)}
                      className={cn(
                        "w-full rounded-t-md",
                        w.label === insights.busiestWeekday ? "bg-[var(--chart-4)]" : "bg-muted-foreground/25"
                      )}
                      style={{ height: `${Math.max(3, (w.paise / maxWeekday) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{w.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Panel>

        {/* Biggest hits */}
        <Panel>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base">
              <IconChip icon={Crown} color="var(--warning)" size="sm" />
              Biggest this month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.biggest.map((row, i) => (
              <div key={`${row.expense_at}-${i}`} className="flex items-center gap-3">
                <span className="w-4 text-center text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <CategoryIcon name={row.category?.name} icon={row.category?.icon} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{row.description}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(row.expense_at), "d MMM")}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatINR(row.amount_paise)}</span>
              </div>
            ))}
          </CardContent>
        </Panel>
      </div>

      <Link
        href={`/analytics?month=${monthKey}`}
        className="surface surface-hover flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium"
      >
        Category, merchant and payment breakdowns live in Analytics
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>
    </div>
  );
}

function Fact({
  icon,
  color,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  color: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Panel size="sm">
      <CardContent className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <IconChip icon={icon} color={color} size="sm" />
        </div>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Panel>
  );
}
