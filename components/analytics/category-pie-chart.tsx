"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatINR } from "@/lib/money";
import { CHART_COLORS } from "./chart-colors";
import { EmptyState } from "@/components/shared/empty-state";
import { PieChart as PieIcon } from "lucide-react";

interface CategoryPieChartProps {
  data: { name: string; paise: number }[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (data.length === 0) {
    return <EmptyState icon={PieIcon} title="No spending yet" description="No expenses in this period." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="paise" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatINR(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
