"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { MoreVertical, Pencil, Repeat, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { investmentStyle } from "@/lib/category-style";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { deleteInvestmentAction } from "@/lib/actions/investments";
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
import { IconChip } from "@/components/shared/icon-chip";
import { InvestmentForm } from "./investment-form";
import type { Investment } from "@/types/domain";

export function InvestmentRow({ investment }: { investment: Investment }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const style = investmentStyle(investment.investment_type);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteInvestmentAction(investment.id);
      toast.success("Investment deleted");
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      logError("investment-delete", error);
      toast.error(toFriendlyMessage(error, "Couldn't delete this investment. Please try again."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 py-2.5 pr-2 pl-3">
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditOpen(true)}>
          <IconChip icon={style.icon} color={style.color} size="md" variant="solid" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {investment.investment_type}
            </p>
            <p className="truncate text-sm font-semibold">{investment.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              {investment.recurring_investment_id && (
                <>
                  <Repeat className="size-3" /> Auto ·
                </>
              )}
              {format(new Date(investment.invested_at), "d MMM yyyy")}
              {investment.notes && ` · ${investment.notes}`}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <span className="font-semibold tabular-nums">{formatINR(investment.amount_paise)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More actions">
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
            <DialogTitle>Edit investment</DialogTitle>
          </DialogHeader>
          <InvestmentForm investment={investment} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this investment?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatINR(investment.amount_paise)} in {investment.name} will be removed from your savings. This
              can&apos;t be undone.
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
