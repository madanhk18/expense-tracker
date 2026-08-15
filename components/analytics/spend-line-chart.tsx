"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR } from "@/lib/money";

interface SpendLineChartProps {
  data: { bucket: string; paise: number }[];
}

export function SpendLineChart({ data }: SpendLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeOpacity={0.3} vertical={false} />
        <XAxis dataKey="bucket" fontSize={11} tickMargin={8} />
        <YAxis tickFormatter={(v) => formatINR(v, { decimals: false })} fontSize={11} width={70} />
        <Tooltip formatter={(value) => formatINR(Number(value))} />
        <Line type="monotone" dataKey="paise" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
