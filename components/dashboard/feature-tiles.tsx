import Link from "next/link";
import { CalendarClock, ChevronRight, HandCoins, PiggyBank, TrendingUp, type LucideIcon } from "lucide-react";
import { IconChip } from "@/components/shared/icon-chip";

export interface FeatureTile {
  href: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  color: string;
}

/** Every money feature, one tap from the dashboard — each with its live number. */
export function FeatureTiles({ tiles }: { tiles: FeatureTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {tiles.map((tile) => (
        <Link
          key={tile.href}
          href={tile.href}
          className="surface surface-hover group flex flex-col gap-2 rounded-xl p-3.5"
        >
          <div className="flex items-center justify-between">
            <IconChip icon={tile.icon} color={tile.color} size="sm" />
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
            <p className="truncate text-lg font-semibold tabular-nums">{tile.value}</p>
            <p className="truncate text-xs text-muted-foreground">{tile.hint}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export const TILE_ICONS = { income: TrendingUp, savings: PiggyBank, lending: HandCoins, bills: CalendarClock };
