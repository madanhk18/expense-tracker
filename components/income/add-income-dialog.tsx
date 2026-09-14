"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IncomeForm } from "./income-form";
import type { Category, IncomeWithCategory } from "@/types/domain";

interface AddIncomeDialogProps {
  categories: Category[];
  income?: IncomeWithCategory;
  trigger?: React.ReactNode;
}

export function AddIncomeDialog({ categories, income, trigger }: AddIncomeDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger ?? (
          <Button className="btn-income">
            <Plus className="mr-1.5 size-4" />
            Add income
          </Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{income ? "Edit income" : "Add income"}</DialogTitle>
          </DialogHeader>
          <IncomeForm categories={categories} income={income} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
