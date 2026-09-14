"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/shared/category-icon";
import type { ExpenseWithCategory } from "@/types/domain";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3 pt-1 text-center">
        <CategoryIcon
          name={expense.category?.name}
          icon={expense.category?.icon}
          size="lg"
          variant="solid"
        />
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {expense.category?.name ?? "Uncategorised"}
          </p>
          <p className="mt-0.5 text-xl font-bold tracking-tight">{expense.description}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">
            {formatINR(expense.amount_paise)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border px-3.5">
        <Detail label="Date" value={formatDate(at, "d MMM yyyy")} />
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
