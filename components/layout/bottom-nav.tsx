"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_NAV_ITEMS } from "./nav-items";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import type { Category } from "@/types/domain";

/**
 * Floating glass bottom bar — two destinations either side of the centre
 * "add expense" button, which is the fastest path to logging a spend.
 */
export function BottomNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const [left, right] = [MOBILE_NAV_ITEMS.slice(0, 2), MOBILE_NAV_ITEMS.slice(2)];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="glass-strong glass-highlight mx-auto flex max-w-md items-center justify-between rounded-3xl px-2 py-1.5">
        {left.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}

        <AddExpenseDialog
          categories={categories}
          trigger={
            <button aria-label="Add expense" className="fab -mt-8 shrink-0">
              <Plus className="size-7" strokeWidth={2.6} />
            </button>
          }
        />

        {right.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof MOBILE_NAV_ITEMS)[number];
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"
      )}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-2xl transition-all duration-200",
          active
            ? "gradient-primary scale-105 shadow-[0_10px_22px_-10px_oklch(0.5_0.2_255/0.9)]"
            : "scale-100"
        )}
      >
        <item.icon className="size-[18px]" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span className="w-full truncate text-center">{item.label}</span>
    </Link>
  );
}
