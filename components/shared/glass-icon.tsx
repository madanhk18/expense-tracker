import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-8 rounded-xl [&>svg]:size-4",
  md: "size-10 rounded-2xl [&>svg]:size-5",
  lg: "size-12 rounded-2xl [&>svg]:size-6",
} as const;

interface GlassIconProps {
  icon: LucideIcon;
  /** Any CSS colour — usually a `var(--cat-*)` from lib/category-style. */
  color: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/**
 * A lucide icon sitting in a tinted frosted-glass chip. The chip carries the
 * colour; the glyph itself stays simple so it reads at every size.
 */
export function GlassIcon({ icon: Icon, color, size = "md", className }: GlassIconProps) {
  return (
    <span
      style={{ "--tint": color } as React.CSSProperties}
      className={cn(
        "glass-chip glass-tint relative grid shrink-0 place-items-center border shadow-[inset_0_1px_0_oklch(1_0_0/0.35),0_6px_14px_-8px_var(--tint)] backdrop-blur-md",
        SIZES[size],
        className
      )}
    >
      <Icon style={{ color }} strokeWidth={2.1} />
    </span>
  );
}
