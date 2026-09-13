import { categoryStyle, paymentStyle } from "@/lib/category-style";
import { GlassIcon } from "./glass-icon";

interface CategoryIconProps {
  name: string | null | undefined;
  /** The category's `icon` column, when it has one. */
  icon?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** The colour-coded chip used for a category anywhere it appears. */
export function CategoryIcon({ name, icon, size = "md", className }: CategoryIconProps) {
  const style = categoryStyle(name, icon);
  return <GlassIcon icon={style.icon} color={style.color} size={size} className={className} />;
}

/** Same idea, keyed off a payment method instead. */
export function PaymentIcon({
  method,
  size = "sm",
  className,
}: {
  method: string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const style = paymentStyle(method);
  return <GlassIcon icon={style.icon} color={style.color} size={size} className={className} />;
}
