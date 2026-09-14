import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 rounded-lg [&>svg]:size-4",
  md: "size-10 rounded-xl [&>svg]:size-5",
  lg: "size-12 rounded-xl [&>svg]:size-6",
} as const;

interface IconChipProps {
  icon: LucideIcon;
  /** Any CSS colour — usually a `var(--cat-*)` from lib/category-style. */
  color: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/**
 * A lucide icon on a pale tint of its own colour. Flat: no blur, no shadow —
 * the colour does the work of telling categories apart.
 */
export function IconChip({ icon: Icon, color, size = "md", className }: IconChipProps) {
  return (
    <span
      style={{ "--tint": color } as React.CSSProperties}
      className={cn("chip grid shrink-0 place-items-center", SIZES[size], className)}
    >
      <Icon style={{ color }} strokeWidth={2} />
    </span>
  );
}
