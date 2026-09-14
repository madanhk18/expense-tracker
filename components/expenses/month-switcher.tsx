"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths, format, isSameMonth } from "date-fns";
import { Button } from "@/components/ui/button";

/** ‹ September 2026 › — steps the list a month at a time via ?month=. */
export function MonthSwitcher({ monthRef }: { monthRef: Date }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(date: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", format(date, "yyyy-MM"));
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const atCurrentMonth = isSameMonth(monthRef, new Date());

  return (
    <div className="flex items-center justify-center gap-1">
      <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => go(subMonths(monthRef, 1))}>
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-36 text-center text-sm font-semibold">{format(monthRef, "MMMM yyyy")}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next month"
        disabled={atCurrentMonth}
        onClick={() => go(addMonths(monthRef, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
