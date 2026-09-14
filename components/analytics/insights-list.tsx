import { Lightbulb } from "lucide-react";
import { IconChip } from "@/components/shared/icon-chip";
import type { Insight } from "@/lib/insights";

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <ul className="space-y-2">
      {insights.map((insight) => (
        <li
          key={insight.id}
          className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-sm"
        >
          <IconChip icon={Lightbulb} color="var(--warning)" size="sm" />
          <span className="pt-1.5">{insight.text}</span>
        </li>
      ))}
    </ul>
  );
}
