"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, Pencil, Repeat, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { formatTime } from "@/lib/dates";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { deleteIncomeAction } from "@/lib/actions/income";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CategoryIcon } from "@/components/shared/category-icon";
import { IncomeForm } from "./income-form";
import type { Category, IncomeWithCategory } from "@/types/domain";

export function IncomeRow({ income, categories }: { income: IncomeWithCategory; categories: Category[] }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteIncomeAction(income.id);
      toast.success("Income deleted");
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      logError("income-delete", error);
      toast.error(toFriendlyMessage(error, "Couldn't delete this income. Please try again."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="surface surface-hover flex items-center justify-between gap-2 rounded-xl py-2.5 pr-2 pl-3">
        <button
          className="relative flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => setEditOpen(true)}
        >
          <CategoryIcon
            name={income.category?.name}
            icon={income.category?.icon}
            size="md"
            variant="solid"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {income.category?.name ?? "Income"}
            </p>
            <p className="truncate text-sm font-semibold">
              {income.description || income.category?.name || "Income"}
            </p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              {income.is_recurring && (
                <>
                  <Repeat className="size-3" /> Monthly ·
                </>
              )}
              {formatTime(new Date(income.received_at))}
            </p>
          </div>
        </button>
        <div className="relative flex items-center gap-1">
          <span className="font-semibold text-[var(--success)] tabular-nums">
            + {formatINR(income.amount_paise)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
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
            <DialogTitle>Edit income</DialogTitle>
          </DialogHeader>
          <IncomeForm categories={categories} income={income} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this income?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatINR(income.amount_paise)} will be permanently deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
