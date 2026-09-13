import type { LucideIcon } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/shared/glass-card";
import { GlassIcon } from "@/components/shared/glass-icon";
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
    <GlassCard tint={tint} size="sm" className={cn("glass-hover", className)}>
      <CardContent className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-foreground/70">{label}</p>
          {icon && tint && <GlassIcon icon={icon} color={tint} size="sm" />}
        </div>
        <p className="text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
        {sub && <p className="text-xs text-foreground/65">{sub}</p>}
      </CardContent>
    </GlassCard>
  );
}
