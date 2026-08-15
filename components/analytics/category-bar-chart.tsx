"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatINR } from "@/lib/money";

interface CategoryBarChartProps {
  data: { name: string; paise: number }[];
}

export function CategoryBarChart({ data }: CategoryBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid horizontal={false} strokeOpacity={0.3} />
        <XAxis type="number" tickFormatter={(v) => formatINR(v, { decimals: false })} fontSize={12} />
        <YAxis type="category" dataKey="name" width={100} fontSize={12} />
        <Tooltip formatter={(value) => formatINR(Number(value))} />
        <Bar dataKey="paise" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
