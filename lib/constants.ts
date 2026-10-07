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

/** Kept in sync with the investment_type check in 0003_money_flows.sql. */
export const INVESTMENT_TYPES = [
  "SIP",
  "Mutual Fund",
  "Stocks",
  "FD",
  "RD",
  "Gold",
  "PPF / EPF",
  "NPS",
  "Other",
] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export const LENDING_DIRECTIONS = ["lent", "borrowed"] as const;
export type LendingDirection = (typeof LENDING_DIRECTIONS)[number];

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
