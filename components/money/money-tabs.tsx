"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const MONEY_TABS = [
  { href: "/income", label: "Income" },
  { href: "/savings", label: "Savings" },
  { href: "/lending", label: "Lending" },
] as const;

/** Income · Savings · Lending — the three places money goes besides spending. */
export function MoneyTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Money" className="flex w-full max-w-sm rounded-full bg-muted p-1">
      {MONEY_TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 rounded-full py-2 text-center text-sm font-medium transition-colors",
              active ? "bg-card text-foreground shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
