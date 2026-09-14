"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/lib/constants";
import { categoryStyle } from "@/lib/category-style";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/domain";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
] as const;

/**
 * Filtering lives behind one control in the header: the list shows everything
 * for the month by default, and narrowing it is opt-in.
 */
export function ExpenseFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [open, setOpen] = useState(false);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    updateParam("q", search || null);
  }

  const activeCategory = searchParams.get("category") ?? "all";
  const activePayment = searchParams.get("payment") ?? "all";
  const activeSort = searchParams.get("sort") ?? "newest";
  // The month is navigation, not a filter — it doesn't count as "narrowed".
  const activeCount = ["q", "category", "payment", "sort"].filter((k) => searchParams.has(k)).length;

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of ["q", "category", "payment", "sort", "range", "page"]) params.delete(key);
    setSearch("");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Filter expenses" className="relative">
          <SlidersHorizontal className="size-4" />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[19rem] gap-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item, merchant, notes…"
            className="pl-10"
          />
        </form>

        <div className="space-y-2">
          <p className="text-[0.8rem] font-medium tracking-wide text-muted-foreground">Category</p>
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            <FilterPill label="All" active={activeCategory === "all"} onClick={() => updateParam("category", null)} />
            {categories.map((cat) => (
              <FilterPill
                key={cat.id}
                label={cat.name}
                color={categoryStyle(cat.name, cat.icon).color}
                active={activeCategory === cat.id}
                onClick={() => updateParam("category", cat.id)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Select defaultValue={activePayment} onValueChange={(v) => updateParam("payment", v)}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payment methods</SelectItem>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue={activeSort} onValueChange={(v) => updateParam("sort", v)}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="mr-1 size-3.5" /> Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function FilterPill({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
      )}
    >
      {color && (
        <span className="size-2 rounded-full" style={{ backgroundColor: active ? "currentColor" : color }} />
      )}
      {label}
    </button>
  );
}
