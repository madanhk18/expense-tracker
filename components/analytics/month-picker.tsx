"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, X } from "lucide-react";
import { addMonths, subMonths, subDays, startOfMonth, endOfMonth, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toISODate } from "@/lib/dates";

/** One-tap ranges, so the common cases never need the date fields. */
function presets() {
  const today = new Date();
  const lastMonth = subMonths(today, 1);
  return [
    { label: "Last 7 days", from: subDays(today, 6), to: today },
    { label: "Last 30 days", from: subDays(today, 29), to: today },
    { label: "Last 3 months", from: subDays(today, 89), to: today },
    { label: "Last month", from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) },
    { label: "This year", from: new Date(today.getFullYear(), 0, 1), to: today },
  ];
}

export function MonthPicker({ monthRef }: { monthRef: Date }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCustomRange = searchParams.has("from") && searchParams.has("to");

  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [open, setOpen] = useState(false);

  function goToMonth(date: Date) {
    router.push(`${pathname}?month=${format(date, "yyyy-MM")}`);
  }

  function applyRange(fromISO: string, toISO: string) {
    setOpen(false);
    router.push(`${pathname}?from=${fromISO}&to=${toISO}`);
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {isCustomRange ? (
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full"
          onClick={() => router.push(pathname)}
        >
          <X className="mr-1.5 size-3.5" />
          Clear range
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
            aria-label="Pick a date range"
          >
            <CalendarRange className="mr-1.5 size-3.5" />
            {isCustomRange ? "Range" : "Custom"}
          </Button>
        </PopoverTrigger>
        {/* Anchored to the trigger's end so it never runs off a phone screen. */}
        <PopoverContent align="end" className="w-[19rem] gap-4">
          <div className="space-y-2">
            <p className="text-[0.8rem] font-medium tracking-wide text-muted-foreground">Quick ranges</p>
            <div className="flex flex-wrap gap-1.5">
              {presets().map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyRange(toISODate(preset.from), toISODate(preset.to))}
                  className="rounded-full border border-white/50 bg-white/45 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/70 dark:border-white/12 dark:bg-white/8 dark:hover:bg-white/16"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <p className="text-[0.8rem] font-medium tracking-wide text-muted-foreground">Pick your own</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  type="date"
                  max={to || undefined}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="date"
                  min={from || undefined}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!from || !to}
              onClick={() => applyRange(from, to)}
            >
              Show this range
            </Button>
            <p className="text-xs text-muted-foreground">
              Both days are included, so 1–31 Aug covers the whole month.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
