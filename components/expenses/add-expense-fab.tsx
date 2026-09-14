"use client";

import { Plus } from "lucide-react";
import { AddExpenseDialog } from "./add-expense-dialog";
import type { Category } from "@/types/domain";

/** Floating add button — mobile only, clear of the bottom bar. */
export function AddExpenseFab({ categories }: { categories: Category[] }) {
  return (
    <div className="fixed right-5 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 md:hidden">
      <AddExpenseDialog
        categories={categories}
        trigger={
          <button aria-label="Add expense" className="fab">
            <Plus className="size-6" strokeWidth={2.4} />
          </button>
        }
      />
    </div>
  );
}
