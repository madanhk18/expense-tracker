import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  HandCoins,
  Layers,
  PiggyBank,
  Sparkles,
  Sprout,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/shared/panel";
import { IconChip } from "@/components/shared/icon-chip";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Highlight, HighlightIcon, HighlightTone } from "@/lib/highlights";

const ICONS: Record<HighlightIcon, LucideIcon> = {
  category: Layers,
  "trend-up": TrendingUp,
  "trend-down": TrendingDown,
  invest: Sprout,
  "invest-empty": PiggyBank,
  lending: HandCoins,
  bill: CalendarClock,
  savings: PiggyBank,
};

const TONES: Record<HighlightTone, string> = {
  good: "var(--success)",
  warn: "var(--warning)",
  info: "var(--chart-1)",
};

/** "This month" — the few things worth knowing, each one tappable. */
export function Highlights({ items }: { items: Highlight[] }) {
  if (items.length === 0) return null;

  return (
    <Panel>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-base">
          <IconChip icon={Sparkles} color="var(--cat-subscriptions)" size="sm" />
          This month at a glance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Swipe on phones, grid on wider screens. */}
        <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible">
          {items.slice(0, 6).map((item) => {
            const Icon = ICONS[item.icon];
            const color = TONES[item.tone];
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "surface surface-hover group flex w-[78%] shrink-0 snap-start flex-col gap-2 rounded-xl p-3.5 sm:w-auto",
                  "border-l-4"
                )}
                style={{ borderLeftColor: color }}
              >
                <div className="flex items-start gap-2.5">
                  <IconChip icon={Icon} color={color} size="sm" />
                  <p className="min-w-0 flex-1 text-sm leading-snug font-semibold">{item.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
                <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary">
                  {item.cta}
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Panel>
  );
}
