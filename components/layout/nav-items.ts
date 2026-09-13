import { LayoutDashboard, Receipt, PieChart, Wallet, Repeat, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/**
 * Subset shown in the mobile bottom nav — four items, two either side of the
 * centre "add expense" button. Budgets stays reachable from Settings.
 */
export const MOBILE_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[5],
] as const;
