import { Lightbulb } from "lucide-react";
import type { Insight } from "@/lib/insights";

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <ul className="space-y-2">
      {insights.map((insight) => (
        <li key={insight.id} className="flex items-start gap-2 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>{insight.text}</span>
        </li>
      ))}
    </ul>
  );
}
