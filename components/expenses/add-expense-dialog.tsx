"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "./expense-form";
import type { Category, ExpenseWithCategory } from "@/types/domain";

interface AddExpenseDialogProps {
  categories: Category[];
  expense?: ExpenseWithCategory;
  trigger?: React.ReactNode;
}

export function AddExpenseDialog({ categories, expense, trigger }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger ?? (
          <Button>
            <Plus className="mr-1.5 size-4" />
            Add Expense
          </Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
          </DialogHeader>
          <ExpenseForm categories={categories} expense={expense} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
