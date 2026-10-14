"use client";

import { useState } from "react";
import { CalendarDays, CreditCard, IndianRupee, Sparkles, Store, Tag } from "lucide-react";
import { parseQuickAdd, type QuickAddCategory, type QuickAddResult } from "@/lib/quick-add";
import { formatINR } from "@/lib/money";
import { Input } from "@/components/ui/input";

const EXAMPLES = ["450 petrol upi", "1.2k swiggy dinner card", "uber 230 yesterday"];

/**
 * One line that fills the whole expense form: "450 petrol upi" →
 * ₹450 · Petrol · UPI. Enter saves. What it understood shows as chips so
 * nothing is filled in silently.
 */
export function QuickAddInput({
  categories,
  onParsed,
  onSubmit,
}: {
  categories: QuickAddCategory[];
  onParsed: (result: QuickAddResult | null) => void;
  onSubmit: () => void;
}) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<QuickAddResult | null>(null);

  function change(value: string) {
    setText(value);
    const result = value.trim() ? parseQuickAdd(value, categories) : null;
    setParsed(result);
    onParsed(result);
  }

  const chips = parsed
    ? [
        parsed.amountPaise !== null && { icon: IndianRupee, text: formatINR(parsed.amountPaise) },
        parsed.categoryName && { icon: Tag, text: parsed.categoryName },
        parsed.paymentMethod && { icon: CreditCard, text: parsed.paymentMethod },
        parsed.merchant && { icon: Store, text: parsed.merchant },
        parsed.dayOffset === -1 && { icon: CalendarDays, text: "Yesterday" },
      ].filter(Boolean) as { icon: typeof Tag; text: string }[]
    : [];

  return (
    <div className="space-y-2 rounded-xl border border-border bg-muted/50 p-3">
      <label htmlFor="quick-add" className="flex items-center gap-1.5 text-xs font-semibold">
        <Sparkles className="size-3.5 text-[var(--cat-subscriptions)]" />
        Quick add
        <span className="font-normal text-muted-foreground">— type it like a note, press Enter</span>
      </label>
      <Input
        id="quick-add"
        value={text}
        autoFocus
        autoComplete="off"
        enterKeyHint="done"
        placeholder={`e.g. ${EXAMPLES[0]}`}
        className="h-11 bg-card text-base"
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span
              key={chip.text}
              className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-medium shadow-[var(--shadow-card)]"
            >
              <chip.icon className="size-3 text-muted-foreground" />
              {chip.text}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => change(example)}
              className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-card hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
