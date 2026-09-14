"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOBILE_NAV_ITEMS } from "./nav-items";

/** A plain bottom bar pinned to the edge of the screen. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 px-4 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-full bg-[var(--nav)] px-2 text-[var(--nav-foreground)] shadow-[0_10px_30px_-10px_oklch(0_0_0/0.55)]">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-[var(--nav-foreground)]" : "text-[var(--nav-foreground)]/55"
              )}
            >
              <item.icon className="size-5" strokeWidth={active ? 2.3 : 1.8} />
              <span className="w-full truncate text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
