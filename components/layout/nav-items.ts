import {
  CalendarClock,
  Ellipsis,
  HandCoins,
  LayoutDashboard,
  PieChart,
  Receipt,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should light this item up. */
  match?: readonly string[];
}

/** Income, Savings and Lending live together under one "Money" entry. */
const MONEY: NavItem = {
  href: "/income",
  label: "Money",
  icon: HandCoins,
  match: ["/income", "/savings", "/lending"],
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  MONEY,
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/recurring", label: "Bills", icon: CalendarClock },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** Mobile bottom bar. Everything else is one tap away under "More". */
export const MOBILE_NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  MONEY,
  { href: "/analytics", label: "Analytics", icon: PieChart },
  {
    href: "/more",
    label: "More",
    icon: Ellipsis,
    match: ["/more", "/recurring", "/settings", "/categories"],
  },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return (item.match ?? [item.href]).some((prefix) => pathname.startsWith(prefix));
}
