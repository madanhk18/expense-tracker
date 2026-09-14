"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";
import { LogoutButton } from "./logout-button";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col p-3 md:flex">
      <div className="glass glass-highlight flex h-full flex-col rounded-3xl p-3">
        <div className="flex h-14 items-center gap-2.5 px-2 font-semibold">
          <span className="gradient-primary grid size-9 place-items-center rounded-xl">
            <Wallet className="size-4.5" />
          </span>
          <span className="gradient-text text-base font-bold tracking-tight">Expenses</span>
        </div>

        <nav className="mt-2 flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-[image:var(--gradient-primary)] text-white shadow-[0_8px_20px_-12px_oklch(0.5_0.19_255/0.8)]"
                    : "text-muted-foreground hover:bg-white/55 hover:text-foreground dark:hover:bg-white/8"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/40 pt-3 dark:border-white/10">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
