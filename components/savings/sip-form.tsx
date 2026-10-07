"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { sipFormSchema, formToSipInsertValues, type SipFormValues } from "@/lib/validations/investment.schema";
import { createSipAction } from "@/lib/actions/investments";
import { RECURRING_FREQUENCIES } from "@/lib/constants";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvestmentTypePicker } from "./investment-type-picker";

/** A repeating investment — logged automatically on every due date. */
export function SipForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SipFormValues>({
    resolver: zodResolver(sipFormSchema),
    defaultValues: {
      amount: "",
      investmentType: "SIP",
      name: "",
      frequency: "monthly",
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  async function onSubmit(values: SipFormValues) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await createSipAction(formToSipInsertValues(values));
      toast.success("SIP set up — it'll log itself on every due date");
      router.refresh();
      onSuccess();
    } catch (error) {
      logError("sip-form-submit", error);
      toast.error(toFriendlyMessage(error, "Couldn't set up this SIP. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sip-amount">Amount each time</Label>
        <div className="flex items-stretch gap-2">
          <span className="btn-income grid w-14 shrink-0 place-items-center rounded-xl text-xl font-semibold">₹</span>
          <Input
            id="sip-amount"
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
        <Label htmlFor="sip-name">Name</Label>
        <Input id="sip-name" placeholder="e.g. Parag Parikh Flexi Cap" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label>Repeats</Label>
          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="sip-start">First date</Label>
          <Input id="sip-start" type="date" {...register("startDate")} />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Each due date adds this amount to Savings automatically. Pause or stop it any time.
      </p>

      <Button type="submit" size="lg" className="btn-income w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Start SIP"}
      </Button>
    </form>
  );
}
