"use client";

import { Pencil, Trash2, type LucideIcon } from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/shared/category-icon";
import { categoryStyle } from "@/lib/category-style";
import type { ExpenseWithCategory } from "@/types/domain";

/** Fixed scatter, so the same expense always looks the same. */
const PATTERN = [
  { left: "6%", top: "12%", rotate: -18, size: 30 },
  { left: "78%", top: "8%", rotate: 14, size: 24 },
  { left: "18%", top: "64%", rotate: 8, size: 22 },
  { left: "86%", top: "58%", rotate: -12, size: 32 },
  { left: "46%", top: "78%", rotate: 20, size: 20 },
  { left: "62%", top: "26%", rotate: -6, size: 18 },
];

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function Glyph({
  size,
  color,
  className,
  style,
  icon: Icon,
}: {
  size: number;
  color: string;
  className?: string;
  style?: React.CSSProperties;
  icon: LucideIcon;
}) {
  return <Icon className={className} style={{ ...style, color }} size={size} strokeWidth={1.6} />;
}

/**
 * What a row opens into: the expense read back plainly, with edit and delete
 * one tap away and a Done button to dismiss. Editing is a deliberate second
 * step, so opening something to check it can't change it by accident.
 */
export function ExpenseDetail({
  expense,
  onEdit,
  onDelete,
  onDone,
}: {
  expense: ExpenseWithCategory;
  onEdit: () => void;
  onDelete: () => void;
  onDone: () => void;
}) {
  const at = new Date(expense.expense_at);

  const { color, icon } = categoryStyle(expense.category?.name, expense.category?.icon);

  return (
    <div className="space-y-5">
      {/* A textured band in the category's colour: the category's own glyph,
          scattered faintly, so each kind of expense opens looking different. */}
      <div
        className="relative -mx-5 -mt-5 flex flex-col items-center gap-3 overflow-hidden px-5 py-8 text-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, color-mix(in oklch, ${color} 20%, var(--card)), color-mix(in oklch, ${color} 6%, var(--card)))`,
        }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]">
          {PATTERN.map((spot, i) => (
            <Glyph
              key={i}
              icon={icon}
              className="absolute"
              style={{ left: spot.left, top: spot.top, transform: `rotate(${spot.rotate}deg)` }}
              size={spot.size}
              color={color}
            />
          ))}
        </div>

        <CategoryIcon
          name={expense.category?.name}
          icon={expense.category?.icon}
          size="lg"
          variant="solid"
          className="relative"
        />
        <div className="relative">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {expense.category?.name ?? "Uncategorised"}
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight">{expense.description}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(at, "d MMM yyyy")}</p>
          <p className="mt-3 text-4xl font-bold tracking-tight tabular-nums">
            {formatINR(expense.amount_paise)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-border rounded-xl bg-muted px-3.5">
        <Detail label="Time" value={formatTime(at)} />
        <Detail label="Payment" value={expense.payment_method} />
        {expense.merchant && <Detail label="Merchant" value={expense.merchant} />}
        {expense.notes && <Detail label="Notes" value={expense.notes} />}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onEdit}>
          <Pencil className="mr-1.5 size-4" />
          Edit
        </Button>
        <Button variant="outline" className="flex-1 text-destructive" onClick={onDelete}>
          <Trash2 className="mr-1.5 size-4" />
          Delete
        </Button>
      </div>

      <Button size="lg" className="w-full rounded-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
