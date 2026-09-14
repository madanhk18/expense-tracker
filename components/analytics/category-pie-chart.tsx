"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { formatINR } from "@/lib/money";
import { categoryStyle } from "@/lib/category-style";
import { TOOLTIP_STYLE } from "./chart-colors";
import { EmptyState } from "@/components/shared/empty-state";

interface CategoryPieChartProps {
  data: { name: string; paise: number }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return <EmptyState icon={PieIcon} title="No spending yet" description="No expenses in this period." />;
  }

  const total = data.reduce((sum, d) => sum + d.paise, 0);

  return (
    <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,200px)_1fr]">
      <div className="relative mx-auto w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey="paise"
              nameKey="name"
              innerRadius={64}
              outerRadius={90}
              paddingAngle={1}
              stroke="none"
              cornerRadius={2}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={categoryStyle(slice.name).color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatINR(Number(value))} {...TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Total</p>
            <p className="text-lg font-bold tabular-nums">{formatINR(total)}</p>
          </div>
        </div>
      </div>

      {/* Legend — values matter as much as the shape, so they're spelled out. */}
      <ul className="space-y-0.5">
        {data.map((slice) => (
          <li
            key={slice.name}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: categoryStyle(slice.name).color }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.name}</span>
            <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {total > 0 ? Math.round((slice.paise / total) * 100) : 0}%
            </span>
            <span className="w-20 shrink-0 text-right font-semibold tabular-nums">
              {formatINR(slice.paise)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
