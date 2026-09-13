import { Lightbulb } from "lucide-react";
import { GlassIcon } from "@/components/shared/glass-icon";
import type { Insight } from "@/lib/insights";

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <ul className="space-y-2">
      {insights.map((insight) => (
        <li
          key={insight.id}
          className="flex items-start gap-3 rounded-2xl border border-white/50 bg-white/40 p-3 text-sm dark:border-white/10 dark:bg-white/6"
        >
          <GlassIcon icon={Lightbulb} color="var(--warning)" size="sm" />
          <span className="pt-1.5">{insight.text}</span>
        </li>
      ))}
    </ul>
  );
}
