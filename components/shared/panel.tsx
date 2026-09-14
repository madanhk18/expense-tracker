import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<typeof Card>;

interface PanelProps extends CardProps {
  /**
   * Optional accent colour. It washes the card in a very light tint so a
   * card's purpose is readable at a glance — one tint per card, at most.
   */
  tint?: string;
  /** Highlight on hover. Use only where the whole card is clickable. */
  interactive?: boolean;
}

/** The app's standard surface: a plain card with a hairline border. */
export function Panel({ tint, interactive, className, style, ...props }: PanelProps) {
  return (
    <Card
      style={tint ? ({ "--tint": tint, ...style } as React.CSSProperties) : style}
      className={cn(tint && "surface-tint", interactive && "surface-hover cursor-pointer", className)}
      {...props}
    />
  );
}
