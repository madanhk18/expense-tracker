"use client";

import { INVESTMENT_TYPES, type InvestmentType } from "@/lib/constants";
import { investmentStyle } from "@/lib/category-style";
import { cn } from "@/lib/utils";

/** Tap-to-pick grid of investment types — quicker than a dropdown on a phone. */
export function InvestmentTypePicker({
  value,
  onChange,
}: {
  value: InvestmentType;
  onChange: (value: InvestmentType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {INVESTMENT_TYPES.map((type) => {
        const { icon: Icon, color } = investmentStyle(type);
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(type)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors",
              selected ? "border-transparent text-white" : "border-border bg-card hover:bg-muted"
            )}
            style={selected ? { backgroundColor: color } : undefined}
          >
            <Icon className="size-4" style={selected ? undefined : { color }} />
            <span className="truncate">{type}</span>
          </button>
        );
      })}
    </div>
  );
}
