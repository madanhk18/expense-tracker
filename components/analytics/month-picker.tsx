"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, subMonths, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MonthPicker({ monthRef }: { monthRef: Date }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [open, setOpen] = useState(false);

  function goToMonth(date: Date) {
    router.push(`${pathname}?month=${format(date, "yyyy-MM")}`);
  }

  function applyCustomRange() {
    if (!from || !to) return;
    setOpen(false);
    router.push(`${pathname}?from=${from}&to=${to}`);
  }

  const isCustomRange = searchParams.has("from");

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {isCustomRange ? (
        <Button variant="ghost" size="sm" className="rounded-full" onClick={() => router.push(pathname)}>
          <ChevronLeft className="mr-1 size-3.5" />
          Back to monthly
        </Button>
      ) : (
        <div className="glass flex items-center justify-between gap-1 rounded-full p-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous month"
            className="rounded-full"
            onClick={() => goToMonth(subMonths(monthRef, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-28 text-center text-sm font-medium">{format(monthRef, "MMMM yyyy")}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next month"
            className="rounded-full"
            onClick={() => goToMonth(addMonths(monthRef, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={isCustomRange ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            aria-label="Pick a custom date range"
          >
            <CalendarRange className="mr-1.5 size-3.5" />
            {isCustomRange ? "Custom range" : "Range"}
          </Button>
        </PopoverTrigger>
        {/* Anchored to the trigger's end so it never runs off a phone screen. */}
        <PopoverContent align="end" className="w-72">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button size="default" className="w-full" disabled={!from || !to} onClick={applyCustomRange}>
            Apply
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
