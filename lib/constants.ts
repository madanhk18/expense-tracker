export const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Net Banking",
  "Other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const RECURRING_FREQUENCIES = ["weekly", "monthly", "yearly"] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

/** Default system categories, seeded once via migration. Kept in sync with 0001_init.sql. */
export const DEFAULT_CATEGORIES = [
  { name: "Food", icon: "Utensils" },
  { name: "Groceries", icon: "ShoppingBasket" },
  { name: "Transportation", icon: "Bus" },
  { name: "Shopping", icon: "ShoppingBag" },
  { name: "Bills", icon: "Receipt" },
  { name: "Entertainment", icon: "Clapperboard" },
  { name: "Healthcare", icon: "HeartPulse" },
  { name: "Education", icon: "GraduationCap" },
  { name: "Travel", icon: "Plane" },
  { name: "Rent", icon: "Home" },
  { name: "Subscriptions", icon: "Repeat" },
  { name: "Personal", icon: "User" },
  { name: "Other", icon: "MoreHorizontal" },
] as const;

/** Budget usage thresholds — used to color-code progress bars. */
export const BUDGET_THRESHOLDS = {
  normal: 70, // < 70% used
  warning: 90, // 70-90% used
  high: 100, // 90-100% used
  // >= 100% => exceeded
} as const;
