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
  /** "tint" = pale wash with a coloured glyph; "solid" = filled tile. */
  variant?: "tint" | "solid";
  className?: string;
}

/**
 * A lucide icon on a pale tint of its own colour. Flat: no blur, no shadow —
 * the colour does the work of telling categories apart.
 */
export function IconChip({
  icon: Icon,
  color,
  size = "md",
  variant = "tint",
  className,
}: IconChipProps) {
  const solid = variant === "solid";

  return (
    <span
      style={
        solid
          ? ({ backgroundColor: color } as React.CSSProperties)
          : ({ "--tint": color } as React.CSSProperties)
      }
      className={cn("grid shrink-0 place-items-center", solid ? "text-white" : "chip", SIZES[size], className)}
    >
      <Icon style={solid ? undefined : { color }} strokeWidth={2} />
    </span>
  );
}
