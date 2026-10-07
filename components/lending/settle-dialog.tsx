"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { settleAction } from "@/lib/actions/lending";
import { formatINR, paiseToRupeeInput, parseToPaise } from "@/lib/money";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LendingRecordWithSettlements } from "@/types/domain";

/** Record all or part of a repayment against one lending entry. */
export function SettleDialog({
  record,
  open,
  onOpenChange,
}: {
  record: LendingRecordWithSettlements;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(paiseToRupeeInput(record.remainingPaise));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const lent = record.direction === "lent";
  const paise = parseToPaise(amount);
  const isFull = paise === record.remainingPaise;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await settleAction(record.id, amount, note);
      if (result?.error) {
        setError(result.error);
        return;
      }
      toast.success(isFull ? "All settled" : "Repayment recorded");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      logError("lending-settle", err);
      toast.error(toFriendlyMessage(err, "Couldn't record this repayment. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {lent ? `${record.person_name} paid you back` : `You paid ${record.person_name} back`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {formatINR(record.remainingPaise)} of {formatINR(record.amount_paise)} still open.
          </p>
          <div className="space-y-2">
            <Label htmlFor="settle-amount">Amount</Label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                id="settle-amount"
                inputMode="decimal"
                className="pl-7 text-lg font-semibold tabular-nums"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="xs" variant="secondary" onClick={() => setAmount(paiseToRupeeInput(record.remainingPaise))}>
                Full amount
              </Button>
              {record.remainingPaise >= 200 && (
                <Button
                  type="button"
                  size="xs"
                  variant="secondary"
                  onClick={() => setAmount(paiseToRupeeInput(Math.round(record.remainingPaise / 2)))}
                >
                  Half
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="settle-note">Note (optional)</Label>
            <Input id="settle-note" placeholder="e.g. via UPI" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || paise === null}>
            {submitting ? "Saving…" : isFull ? "Mark as settled" : "Record repayment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
