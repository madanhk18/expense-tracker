import {
  Briefcase,
  Bus,
  Clapperboard,
  CreditCard,
  Gift,
  Landmark,
  Laptop,
  Percent,
  GraduationCap,
  HeartPulse,
  Home,
  Banknote,
  MoreHorizontal,
  Plane,
  Receipt,
  Repeat,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Undo2,
  User,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Visual identity for a category: one accent colour + one icon, resolved from
 * the category name (and the `icon` column when it's set). Charts, icon chips,
 * budget bars and legends all read from here so a category looks the same
 * everywhere in the app.
 *
 * Colours are CSS variables declared in app/globals.css, so they follow the
 * active theme automatically.
 */

const ICONS: Record<string, LucideIcon> = {
  Utensils,
  ShoppingBasket,
  Bus,
  ShoppingBag,
  Receipt,
  Clapperboard,
  HeartPulse,
  GraduationCap,
  Plane,
  Home,
  Repeat,
  User,
  MoreHorizontal,
  Wallet,
  CreditCard,
  Banknote,
  Landmark,
  Smartphone,
  Laptop,
  Percent,
  Gift,
  Undo2,
  Briefcase,
};

interface CategoryStyle {
  /** A `var(--cat-*)` reference — usable as a CSS colour anywhere. */
  color: string;
  icon: LucideIcon;
}

const BY_NAME: Record<string, CategoryStyle> = {
  food: { color: "var(--cat-food)", icon: Utensils },
  groceries: { color: "var(--cat-groceries)", icon: ShoppingBasket },
  transportation: { color: "var(--cat-transportation)", icon: Bus },
  transport: { color: "var(--cat-transportation)", icon: Bus },
  shopping: { color: "var(--cat-shopping)", icon: ShoppingBag },
  bills: { color: "var(--cat-bills)", icon: Receipt },
  entertainment: { color: "var(--cat-entertainment)", icon: Clapperboard },
  healthcare: { color: "var(--cat-healthcare)", icon: HeartPulse },
  health: { color: "var(--cat-healthcare)", icon: HeartPulse },
  education: { color: "var(--cat-education)", icon: GraduationCap },
  travel: { color: "var(--cat-travel)", icon: Plane },
  rent: { color: "var(--cat-rent)", icon: Home },
  subscriptions: { color: "var(--cat-subscriptions)", icon: Repeat },
  personal: { color: "var(--cat-personal)", icon: User },
  other: { color: "var(--cat-other)", icon: MoreHorizontal },

  // Income sources (seeded by 0002_income.sql) — the green end of the palette,
  // so money in never reads like money out.
  salary: { color: "var(--cat-healthcare)", icon: Briefcase },
  freelance: { color: "var(--cat-travel)", icon: Laptop },
  interest: { color: "var(--cat-groceries)", icon: Percent },
  gift: { color: "var(--cat-shopping)", icon: Gift },
  refund: { color: "var(--cat-transportation)", icon: Undo2 },
  "other income": { color: "var(--cat-other)", icon: Wallet },
};

/** Palette custom categories cycle through, so they're colourful but stable. */
const FALLBACK_COLORS = [
  "var(--cat-entertainment)",
  "var(--cat-bills)",
  "var(--cat-transportation)",
  "var(--cat-shopping)",
  "var(--cat-food)",
  "var(--cat-healthcare)",
  "var(--cat-subscriptions)",
  "var(--cat-travel)",
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function categoryStyle(
  name: string | null | undefined,
  iconName?: string | null
): CategoryStyle {
  const key = (name ?? "").trim().toLowerCase();
  const known = BY_NAME[key];
  const icon = (iconName && ICONS[iconName]) || known?.icon || Wallet;

  return {
    color: known?.color ?? FALLBACK_COLORS[hash(key) % FALLBACK_COLORS.length],
    icon,
  };
}

/** Ordered colours for charts whose slices aren't category-bound. */
export function categoryColors(names: string[]): string[] {
  return names.map((n) => categoryStyle(n).color);
}

/* -------------------------------------------------------------------------- */

const PAYMENT_STYLES: Record<string, CategoryStyle> = {
  upi: { color: "var(--cat-travel)", icon: Smartphone },
  cash: { color: "var(--cat-rent)", icon: Banknote },
  "credit card": { color: "var(--cat-subscriptions)", icon: CreditCard },
  "debit card": { color: "var(--cat-education)", icon: CreditCard },
  "bank transfer": { color: "var(--cat-bills)", icon: Landmark },
  "net banking": { color: "var(--cat-transportation)", icon: Landmark },
  other: { color: "var(--cat-other)", icon: Wallet },
};

export function paymentStyle(method: string | null | undefined): CategoryStyle {
  return (
    PAYMENT_STYLES[(method ?? "").trim().toLowerCase()] ?? PAYMENT_STYLES.other
  );
}
