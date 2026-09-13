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
      <div className="glass glass-highlight mx-auto flex max-w-md items-center justify-between rounded-3xl px-2 py-1.5">
        {left.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}

        <AddExpenseDialog
          categories={categories}
          trigger={
            <button
              aria-label="Add expense"
              className="gradient-primary -mt-7 grid size-14 shrink-0 place-items-center rounded-full transition-transform active:scale-95"
            >
              <Plus className="size-6" />
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
        "flex w-16 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "grid size-8 place-items-center rounded-xl transition-colors",
          active && "bg-[image:var(--gradient-primary)] text-white"
        )}
      >
        <item.icon className="size-[18px]" />
      </span>
      {item.label}
    </Link>
  );
}
