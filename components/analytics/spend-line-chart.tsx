"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR } from "@/lib/money";
import { AXIS_STYLE, TOOLTIP_STYLE } from "./chart-colors";

interface SpendLineChartProps {
  data: { bucket: string; paise: number }[];
}

export function SpendLineChart({ data }: SpendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: 0, right: 14, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="bucket" tickMargin={8} {...AXIS_STYLE} />
        <YAxis tickFormatter={(v) => formatINR(v, { decimals: false })} width={70} {...AXIS_STYLE} />
        <Tooltip formatter={(value) => formatINR(Number(value))} {...TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey="paise"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          fill="url(#spendFill)"
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--background)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
