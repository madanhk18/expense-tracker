"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { budgetFormSchema, type BudgetFormValues } from "@/lib/validations/budget.schema";
import { parseToPaise, paiseToRupeeInput } from "@/lib/money";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Plus } from "lucide-react";

interface BudgetFormProps {
  label: string;
  currentPaise?: number;
  onSave: (amountPaise: number) => Promise<void>;
  buttonLabel?: string;
}

export function BudgetForm({ label, currentPaise, onSave, buttonLabel }: BudgetFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: { amount: currentPaise ? paiseToRupeeInput(currentPaise) : "" },
  });

  async function onSubmit(values: BudgetFormValues) {
    const paise = parseToPaise(values.amount);
    if (paise === null) return;

    setSubmitting(true);
    try {
      await onSave(paise);
      toast.success("Budget saved");
      setOpen(false);
      router.refresh();
    } catch (error) {
      logError("budget-save", error);
      toast.error(toFriendlyMessage(error, "Couldn't save this budget. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {currentPaise ? <Pencil className="mr-1.5 size-3.5" /> : <Plus className="mr-1.5 size-3.5" />}
          {buttonLabel ?? (currentPaise ? "Edit" : "Set budget")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Monthly amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input id="amount" inputMode="decimal" className="pl-7" autoFocus {...register("amount")} />
            </div>
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Save budget"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
