import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<typeof Card>;

interface GlassCardProps extends CardProps {
  /**
   * Optional accent colour. It washes the card in a soft tint so a card's
   * purpose is readable at a glance — keep it to one tint per card.
   */
  tint?: string;
  /** Lift the card on hover. Use only where the whole card is clickable. */
  interactive?: boolean;
}

/**
 * The app's standard surface: frosted glass, optionally tinted.
 * `Card` is already glass — this adds the tint and the hover lift.
 */
export function GlassCard({ tint, interactive, className, style, ...props }: GlassCardProps) {
  return (
    <Card
      style={tint ? ({ "--tint": tint, ...style } as React.CSSProperties) : style}
      className={cn(
        "glass-highlight",
        tint && "glass-tint",
        interactive && "glass-hover cursor-pointer",
        className
      )}
      {...props}
    />
  );
}
