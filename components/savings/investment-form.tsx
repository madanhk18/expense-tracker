"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  investmentFormSchema,
  formToInvestmentInsertValues,
  type InvestmentFormValues,
} from "@/lib/validations/investment.schema";
import { createInvestmentAction, updateInvestmentAction } from "@/lib/actions/investments";
import { paiseToRupeeInput } from "@/lib/money";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvestmentTypePicker } from "./investment-type-picker";
import type { Investment } from "@/types/domain";

interface InvestmentFormProps {
  investment?: Investment;
  onSuccess: () => void;
}

export function InvestmentForm({ investment, onSuccess }: InvestmentFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const defaults: InvestmentFormValues = investment
    ? {
        amount: paiseToRupeeInput(investment.amount_paise),
        investmentType: investment.investment_type,
        name: investment.name,
        date: format(new Date(investment.invested_at), "yyyy-MM-dd"),
        notes: investment.notes ?? "",
      }
    : {
        amount: "",
        investmentType: "SIP",
        name: "",
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentFormSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: InvestmentFormValues) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const wire = formToInvestmentInsertValues(values);
      if (investment) {
        await updateInvestmentAction(investment.id, wire);
        toast.success("Investment updated");
      } else {
        await createInvestmentAction(wire);
        toast.success("Investment added");
      }
      router.refresh();
      onSuccess();
    } catch (error) {
      logError("investment-form-submit", error);
      toast.error(toFriendlyMessage(error, "Couldn't save this investment. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="investment-amount">Amount invested</Label>
        <div className="flex items-stretch gap-2">
          <span className="btn-income grid w-14 shrink-0 place-items-center rounded-xl text-xl font-semibold">₹</span>
          <Input
            id="investment-amount"
            inputMode="decimal"
            placeholder="0"
            className="h-16 rounded-xl text-3xl font-bold tabular-nums md:text-3xl"
            autoFocus
            {...register("amount")}
          />
        </div>
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <Controller
          control={control}
          name="investmentType"
          render={({ field }) => <InvestmentTypePicker value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="investment-name">Name</Label>
        <Input id="investment-name" placeholder="e.g. Axis Bluechip, SBI FD" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="investment-date">Date</Label>
          <Input id="investment-date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="investment-notes">Note (optional)</Label>
          <Input id="investment-notes" placeholder="Folio, maturity…" {...register("notes")} />
        </div>
      </div>

      <Button type="submit" size="lg" className="btn-income w-full" disabled={submitting}>
        {submitting ? "Saving…" : investment ? "Save changes" : "Add investment"}
      </Button>
    </form>
  );
}
