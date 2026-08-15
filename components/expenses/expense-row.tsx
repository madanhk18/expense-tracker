"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatTime } from "@/lib/dates";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "./expense-form";
import type { Category, ExpenseWithCategory } from "@/types/domain";

export function ExpenseRow({ expense, categories }: { expense: ExpenseWithCategory; categories: Category[] }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
      if (error) throw error;
      toast.success("Expense deleted");
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      logError("expense-delete", error);
      toast.error(toFriendlyMessage(error, "Couldn't delete this expense. Please try again."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 py-2.5">
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditOpen(true)}>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{expense.description}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {expense.category && <Badge variant="secondary" className="font-normal">{expense.category.name}</Badge>}
              <span>{expense.payment_method}</span>
              {expense.merchant && <span>· {expense.merchant}</span>}
              <span>· {formatTime(new Date(expense.expense_at))}</span>
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-medium tabular-nums">{formatINR(expense.amount_paise)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit expense</DialogTitle>
          </DialogHeader>
          <ExpenseForm categories={categories} expense={expense} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{expense.description}&quot; for {formatINR(expense.amount_paise)} will be permanently deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
