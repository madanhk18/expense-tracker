"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/lib/constants";
import { categoryStyle } from "@/lib/category-style";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/domain";

const DATE_PRESETS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount_desc", label: "Amount: high to low" },
  { value: "amount_asc", label: "Amount: low to high" },
] as const;

export function ExpenseFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

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
    updateParam("q", search || null);
  }

  const activeCategory = searchParams.get("category") ?? "all";
  const hasActiveFilters = [...searchParams.keys()].some((k) => k !== "page");

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by item, merchant, notes…"
          className="rounded-full pl-10"
        />
      </form>

      {/* Category pills — the filter people reach for most often. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterPill
          label="All"
          active={activeCategory === "all"}
          onClick={() => updateParam("category", null)}
        />
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

      <div className="flex flex-wrap gap-2">
        <Select defaultValue={searchParams.get("range") ?? "all"} onValueChange={(v) => updateParam("range", v)}>
          <SelectTrigger size="sm" className="w-auto min-w-32 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select defaultValue={searchParams.get("payment") ?? "all"} onValueChange={(v) => updateParam("payment", v)}>
          <SelectTrigger size="sm" className="w-auto min-w-32 rounded-full">
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

        <Select defaultValue={searchParams.get("sort") ?? "newest"} onValueChange={(v) => updateParam("sort", v)}>
          <SelectTrigger size="sm" className="w-auto min-w-32 rounded-full">
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

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => router.push(pathname)}>
            <X className="mr-1 size-3.5" /> Clear
          </Button>
        )}
      </div>
    </div>
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
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all active:scale-[0.97]",
        active
          ? "border-white/25 bg-[image:var(--gradient-primary)] text-white shadow-[0_8px_20px_-12px_oklch(0.55_0.2_290/0.8)]"
          : "border-white/50 bg-white/45 text-muted-foreground backdrop-blur-md hover:bg-white/65 dark:border-white/10 dark:bg-white/8 dark:hover:bg-white/14"
      )}
    >
      {color && (
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: active ? "currentColor" : color }}
        />
      )}
      {label}
    </button>
  );
}
