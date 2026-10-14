import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatINR } from "@/lib/money";
import { monthLabel } from "@/lib/dates";

interface ExpenseHeroProps {
  monthRef: Date;
  totalPaise: number;
  count: number;
  previousMonthPaise: number;
  daysElapsed: number;
  daysInMonth: number;
  cumulative: number[];
  projectedPaise: number | null;
  /** True when a search/filter narrows the list, so the total is the filtered one. */
  filtered?: boolean;
}

/**
 * The month's total as a dark statement card: amount, change vs last month,
 * pace, and a line of the month so far (dashed to where it's heading).
 * Dark in both themes on purpose — it's the page's centrepiece.
 */
export function ExpenseHero({
  monthRef,
  totalPaise,
  count,
  previousMonthPaise,
  daysElapsed,
  daysInMonth,
  cumulative,
  projectedPaise,
  filtered,
}: ExpenseHeroProps) {
  const change = previousMonthPaise > 0 ? Math.round(((totalPaise - previousMonthPaise) / previousMonthPaise) * 100) : null;
  const avgPaise = daysElapsed > 0 ? Math.round(totalPaise / daysElapsed) : 0;

  // Sparkline geometry.
  const W = 300;
  const H = 64;
  const top = Math.max(1, projectedPaise ?? 0, cumulative[cumulative.length - 1] ?? 0);
  const x = (i: number) => (daysInMonth > 1 ? (i / (daysInMonth - 1)) * W : 0);
  const y = (v: number) => H - 4 - (v / top) * (H - 8);
  const line = cumulative.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = cumulative.length - 1;
  const area = cumulative.length > 1 ? `${line} L${x(last).toFixed(1)},${H} L0,${H} Z` : "";

  return (
    <section
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-[0_24px_48px_-28px_oklch(0.2_0.02_260)] sm:p-6"
      style={{
        background:
          "radial-gradient(110% 90% at 0% 0%, oklch(0.33 0.07 255) 0%, transparent 60%), radial-gradient(80% 80% at 100% 100%, oklch(0.32 0.08 20) 0%, transparent 60%), oklch(0.17 0.012 260)",
      }}
    >
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-white/55 uppercase">
            {filtered ? "Matching expenses" : "Spent"} · {monthLabel(monthRef)}
          </p>
          <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">{formatINR(totalPaise)}</p>
        </div>
        {change !== null && !filtered && (
          <span
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{
              backgroundColor: change > 0 ? "oklch(0.65 0.2 25 / 0.22)" : "oklch(0.7 0.15 155 / 0.22)",
              color: change > 0 ? "oklch(0.85 0.1 25)" : "oklch(0.88 0.12 155)",
            }}
          >
            {change > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(change)}% vs last month
          </span>
        )}
      </div>

      {!filtered && cumulative.length > 1 && (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="relative mt-4 h-16 w-full" aria-hidden>
          <defs>
            <linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.22" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#hero-fill)" />
          <path d={line} fill="none" stroke="white" strokeOpacity="0.85" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {projectedPaise !== null && last < daysInMonth - 1 && (
            <path
              d={`M${x(last).toFixed(1)},${y(cumulative[last]!).toFixed(1)} L${W},${y(projectedPaise).toFixed(1)}`}
              fill="none"
              stroke="white"
              strokeOpacity="0.4"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      )}

      <dl className="relative mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-sm">
        <div>
          <dt className="text-[11px] text-white/50">Expenses</dt>
          <dd className="font-semibold tabular-nums">{count}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-white/50">Per day</dt>
          <dd className="font-semibold tabular-nums">{formatINR(avgPaise, { decimals: false })}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-white/50">{projectedPaise !== null ? "On pace for" : "Last month"}</dt>
          <dd className="font-semibold tabular-nums">
            {formatINR(projectedPaise ?? previousMonthPaise, { decimals: false })}
          </dd>
        </div>
      </dl>
    </section>
  );
}
