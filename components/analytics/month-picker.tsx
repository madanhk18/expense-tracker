"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  function goToMonth(date: Date) {
    router.push(`${pathname}?month=${format(date, "yyyy-MM")}`);
  }

  function applyCustomRange() {
    if (!from || !to) return;
    router.push(`${pathname}?from=${from}&to=${to}`);
  }

  const isCustomRange = searchParams.has("from");

  return (
    <div className="flex items-center gap-2">
      {!isCustomRange && (
        <>
          <Button variant="outline" size="icon" onClick={() => goToMonth(subMonths(monthRef, 1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-medium">{format(monthRef, "MMMM yyyy")}</span>
          <Button variant="outline" size="icon" onClick={() => goToMonth(addMonths(monthRef, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={isCustomRange ? "default" : "outline"} size="sm">
            Custom range
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button size="sm" className="w-full" onClick={applyCustomRange}>
            Apply
          </Button>
        </PopoverContent>
      </Popover>
      {isCustomRange && (
        <Button variant="ghost" size="sm" onClick={() => router.push(pathname)}>
          Back to monthly view
        </Button>
      )}
    </div>
  );
}
