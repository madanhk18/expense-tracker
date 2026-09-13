"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR } from "@/lib/money";
import { categoryStyle, paymentStyle } from "@/lib/category-style";
import { AXIS_STYLE, TOOLTIP_STYLE } from "./chart-colors";

interface CategoryBarChartProps {
  data: { name: string; paise: number }[];
  /** Which palette the bars take their colours from. */
  colorBy?: "category" | "payment";
}

export function CategoryBarChart({ data, colorBy = "category" }: CategoryBarChartProps) {
  const colorFor = (name: string) =>
    colorBy === "payment" ? paymentStyle(name).color : categoryStyle(name).color;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.6} />
        <XAxis
          type="number"
          tickFormatter={(v) => formatINR(v, { decimals: false })}
          {...AXIS_STYLE}
        />
        <YAxis type="category" dataKey="name" width={100} {...AXIS_STYLE} />
        <Tooltip formatter={(value) => formatINR(Number(value))} {...TOOLTIP_STYLE} />
        <Bar dataKey="paise" radius={[0, 8, 8, 0]} barSize={18}>
          {data.map((row) => (
            <Cell key={row.name} fill={colorFor(row.name)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
