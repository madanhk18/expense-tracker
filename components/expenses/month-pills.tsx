"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, isSameMonth, subMonths, isAfter, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

/** The last six months as pills; future months are shown but not selectable. */
export function MonthPills({ monthRef }: { monthRef: Date }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = new Date();
  const months = Array.from({ length: 6 }, (_, i) => subMonths(startOfMonth(today), 5 - i));

  function select(date: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", format(date, "yyyy-MM"));
    params.delete("page");
    params.delete("range");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="scroll-fade-x -mx-4 flex justify-center gap-2 overflow-x-auto px-4 pb-1">
      {months.map((month) => {
        const active = isSameMonth(month, monthRef);
        const future = isAfter(month, startOfMonth(today));
        return (
          <button
            key={month.toISOString()}
            type="button"
            disabled={future}
            onClick={() => select(month)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : future
                  ? "bg-muted text-muted-foreground/50"
                  : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {format(month, "MMM")}
          </button>
        );
      })}
    </div>
  );
}
