"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { AlertCircle, ArrowDownLeft, ArrowUpRight, ChevronDown, CircleCheck, MoreVertical, Plus, Trash2, Undo2 } from "lucide-react";
import { formatINR } from "@/lib/money";
import { daysUntil } from "@/lib/dates";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { deleteLendingAction, deleteSettlementAction } from "@/lib/actions/lending";
import { cn } from "@/lib/utils";
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
import { SettleDialog } from "./settle-dialog";
import { AddLendingDialog } from "./add-lending-dialog";
import type { LendingPerson, LendingRecordWithSettlements } from "@/types/domain";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** One person: the net balance up top, every entry and repayment underneath. */
export function PersonCard({ person, people }: { person: LendingPerson; people: string[] }) {
  const open = person.owedToYouPaise + person.youOwePaise > 0;
  const [expanded, setExpanded] = useState(false);

  const net = person.netPaise;
  const tone = net > 0 ? "var(--success)" : net < 0 ? "var(--destructive)" : "var(--muted-foreground)";

  return (
    <div className="surface overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted"
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: open ? tone : "var(--cat-other)" }}
        >
          {initials(person.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{person.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {person.records.length} {person.records.length === 1 ? "entry" : "entries"}
            {person.owedToYouPaise > 0 && person.youOwePaise > 0 &&
              ` · they owe ${formatINR(person.owedToYouPaise, { decimals: false })}, you owe ${formatINR(person.youOwePaise, { decimals: false })}`}
          </p>
        </div>
        <div className="text-right">
          {net === 0 ? (
            <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              <CircleCheck className="size-4" /> Settled
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground">{net > 0 ? "Owes you" : "You owe"}</p>
              <p className="font-semibold tabular-nums" style={{ color: tone }}>
                {formatINR(Math.abs(net))}
              </p>
            </>
          )}
        </div>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border bg-muted/40 p-3">
          {person.records.map((record) => (
            <RecordItem key={record.id} record={record} />
          ))}
          <AddLendingDialog
            people={people}
            defaultPerson={person.name}
            trigger={
              <Button variant="ghost" size="sm" className="w-full">
                <Plus className="size-4" /> New entry with {person.name}
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}

function dueText(dueDate: string | null, remainingPaise: number) {
  if (!dueDate || remainingPaise === 0) return null;
  const days = daysUntil(parseISO(dueDate));
  if (days < 0) return { text: `Overdue by ${-days} day${days === -1 ? "" : "s"}`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  return { text: `Due ${format(parseISO(dueDate), "d MMM")}`, overdue: false };
}

function RecordItem({ record }: { record: LendingRecordWithSettlements }) {
  const router = useRouter();
  const [settleOpen, setSettleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const lent = record.direction === "lent";
  const settled = record.remainingPaise === 0;
  const repaidPercent = Math.round((record.settledPaise / record.amount_paise) * 100);
  const due = dueText(record.due_date, record.remainingPaise);

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      logError("lending-action", error);
      toast.error(toFriendlyMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
            lent ? "bg-[var(--success)]/15 text-[var(--success)]" : "bg-destructive/10 text-destructive"
          )}
        >
          {lent ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {lent ? "You gave" : "You took"} {formatINR(record.amount_paise)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {format(new Date(record.lent_at), "d MMM yyyy")}
            {record.description && ` · ${record.description}`}
          </p>
          {due && (
            <p className={cn("mt-0.5 flex items-center gap-1 text-xs", due.overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
              {due.overdue && <AlertCircle className="size-3" />}
              {due.text}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" disabled={busy} aria-label="Entry actions">
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 size-4" /> Delete entry
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--success)] transition-[width]"
            style={{ width: `${repaidPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">
            {settled ? "Fully paid back" : `${formatINR(record.remainingPaise)} left`}
            {record.settledPaise > 0 && !settled && ` · ${repaidPercent}% back`}
          </span>
          {!settled && (
            <Button size="xs" variant="secondary" onClick={() => setSettleOpen(true)}>
              {lent ? "Got paid back" : "Paid back"}
            </Button>
          )}
        </div>
      </div>

      {record.settlements.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {record.settlements.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Undo2 className="size-3 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                {formatINR(s.amount_paise)} on {format(new Date(s.settled_at), "d MMM")}
                {s.note && ` · ${s.note}`}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => deleteSettlementAction(s.id, record.id), "Repayment removed")}
                className="rounded px-1 hover:text-destructive"
                aria-label="Remove repayment"
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Keyed on the balance so the prefilled amount is fresh every time it opens. */}
      <SettleDialog key={record.remainingPaise} record={record} open={settleOpen} onOpenChange={setSettleOpen} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatINR(record.amount_paise)} with {record.person_name} and its repayment history will be removed.
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" disabled={busy} onClick={() => run(() => deleteLendingAction(record.id), "Entry deleted")}>
              {busy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
