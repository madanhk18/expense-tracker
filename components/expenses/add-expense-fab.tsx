"use client";

import { Plus } from "lucide-react";
import { AddExpenseDialog } from "./add-expense-dialog";
import type { Category } from "@/types/domain";

/** Floating action button — mobile-only, always reachable regardless of scroll position. */
export function AddExpenseFab({ categories }: { categories: Category[] }) {
  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      <AddExpenseDialog
        categories={categories}
        trigger={
          <button
            aria-label="Add expense"
            className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
          >
            <Plus className="size-6" />
          </button>
        }
      />
    </div>
  );
}
