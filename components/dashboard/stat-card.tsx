import type { LucideIcon } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  /** Accent colour for the tint and the icon chip. */
  tint?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, sub, tint, icon, className }: StatCardProps) {
  return (
    <Panel size="sm" className={cn("surface-hover", className)}>
      <CardContent className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
          {icon && tint && <IconChip icon={icon} color={tint} size="sm" />}
        </div>
        <p className="text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Panel>
  );
}
