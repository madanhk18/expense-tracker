"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatINR } from "@/lib/money";
import { investmentStyle } from "@/lib/category-style";
import { TOOLTIP_STYLE } from "@/components/analytics/chart-colors";
import { IconChip } from "@/components/shared/icon-chip";

/** Donut of all-time savings by type, with a legend of chips. */
export function SavingsMixChart({ data }: { data: { name: string; paise: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.paise, 0);

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,180px)_1fr]">
      <div className="relative mx-auto w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              dataKey="paise"
              nameKey="name"
              innerRadius={58}
              outerRadius={82}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={investmentStyle(slice.name).color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatINR(Number(value))} {...TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Saved</p>
            <p className="text-lg font-bold tabular-nums">{formatINR(total, { decimals: false })}</p>
          </div>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-1">
        {data.map((slice) => {
          const style = investmentStyle(slice.name);
          return (
            <li key={slice.name} className="surface flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2">
              <IconChip icon={style.icon} color={style.color} size="sm" variant="solid" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{slice.name}</p>
                <p className="truncate text-xs text-muted-foreground tabular-nums">
                  {formatINR(slice.paise, { decimals: false })}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                {total > 0 ? Math.round((slice.paise / total) * 100) : 0}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
