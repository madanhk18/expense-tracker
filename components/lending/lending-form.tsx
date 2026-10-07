"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  lendingFormSchema,
  formToLendingInsertValues,
  type LendingFormValues,
} from "@/lib/validations/lending.schema";
import { createLendingAction } from "@/lib/actions/lending";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LendingDirection } from "@/lib/constants";

const DIRECTIONS: { value: LendingDirection; label: string; hint: string; icon: typeof ArrowUpRight }[] = [
  { value: "lent", label: "I gave", hint: "They owe me", icon: ArrowUpRight },
  { value: "borrowed", label: "I took", hint: "I owe them", icon: ArrowDownLeft },
];

interface LendingFormProps {
  /** Names already used, offered as suggestions so one person stays one person. */
  people: string[];
  defaultPerson?: string;
  defaultDirection?: LendingDirection;
  onSuccess: () => void;
}

export function LendingForm({ people, defaultPerson, defaultDirection = "lent", onSuccess }: LendingFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LendingFormValues>({
    resolver: zodResolver(lendingFormSchema),
    defaultValues: {
      amount: "",
      direction: defaultDirection,
      personName: defaultPerson ?? "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      dueDate: "",
    },
  });
  const direction = useWatch({ control, name: "direction" });

  async function onSubmit(values: LendingFormValues) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await createLendingAction(formToLendingInsertValues(values));
      toast.success(values.direction === "lent" ? `Noted — ${values.personName} owes you` : `Noted — you owe ${values.personName}`);
      router.refresh();
      onSuccess();
    } catch (error) {
      logError("lending-form-submit", error);
      toast.error(toFriendlyMessage(error, "Couldn't save this entry. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        control={control}
        name="direction"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-2">
            {DIRECTIONS.map((d) => {
              const selected = field.value === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => field.onChange(d.value)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    selected ? "btn-solid border-transparent" : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <d.icon className="size-4 shrink-0" />
                  <span>
                    <span className="block text-sm font-semibold">{d.label}</span>
                    <span className={cn("block text-xs", selected ? "text-white/75" : "text-muted-foreground")}>
                      {d.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      />

      <div className="space-y-2">
        <Label htmlFor="lending-amount">Amount</Label>
        <div className="flex items-stretch gap-2">
          <span className="btn-solid grid w-14 shrink-0 place-items-center rounded-xl text-xl font-semibold">₹</span>
          <Input
            id="lending-amount"
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
        <Label htmlFor="lending-person">{direction === "lent" ? "Given to" : "Taken from"}</Label>
        <Input id="lending-person" list="lending-people" placeholder="Name" autoComplete="off" {...register("personName")} />
        <datalist id="lending-people">
          {people.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        {errors.personName && <p className="text-sm text-destructive">{errors.personName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lending-description">What for (optional)</Label>
        <Input id="lending-description" placeholder="e.g. Trip share, rent help" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="lending-date">Date</Label>
          <Input id="lending-date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="min-w-0 space-y-2">
          <Label htmlFor="lending-due">Pay back by (optional)</Label>
          <Input id="lending-due" type="date" {...register("dueDate")} />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
