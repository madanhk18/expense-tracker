"use client";

import Link from "next/link";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { formatINR } from "@/lib/money";
import { categoryStyle } from "@/lib/category-style";
import { TOOLTIP_STYLE } from "./chart-colors";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryIcon } from "@/components/shared/category-icon";

interface CategoryPieChartProps {
  data: { categoryId?: string; name: string; paise: number }[];
  /** Shown under the total in the middle of the ring. */
  transactionCount?: number;
}

function CategoryChip({
  categoryId,
  name,
  paise,
  percent,
}: {
  categoryId?: string;
  name: string;
  paise: number;
  percent: number;
}) {
  const body = (
    <>
      <CategoryIcon name={name} size="sm" variant="solid" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold">{name}</p>
        <p className="truncate text-xs text-muted-foreground tabular-nums">{formatINR(paise)}</p>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{percent}%</span>
    </>
  );
  const className = "surface surface-hover flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2";

  // Uncategorised spending has no category page to open.
  return categoryId && categoryId !== "uncategorized" ? (
    <Link href={`/categories/${categoryId}`} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function CategoryPieChart({ data, transactionCount }: CategoryPieChartProps) {
  if (data.length === 0) {
    return <EmptyState icon={PieIcon} title="No spending yet" description="No expenses in this period." />;
  }

  const total = data.reduce((sum, d) => sum + d.paise, 0);

  return (
    <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,200px)_1fr]">
      <div className="relative mx-auto w-full max-w-[260px]">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="paise"
              nameKey="name"
              innerRadius={78}
              outerRadius={110}
              paddingAngle={0}
              stroke="none"
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
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Overall</p>
            <p className="text-xl font-bold tabular-nums">{formatINR(total)}</p>
            {transactionCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                {transactionCount} {transactionCount === 1 ? "expense" : "expenses"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Each category as its own chip: icon, name, amount. */}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-1">
        {data.map((slice) => (
          <li key={slice.name}>
            <CategoryChip
              categoryId={slice.categoryId}
              name={slice.name}
              paise={slice.paise}
              percent={total > 0 ? Math.round((slice.paise / total) * 100) : 0}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
