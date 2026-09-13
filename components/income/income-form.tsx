"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  incomeFormSchema,
  formToIncomeInsertValues,
  type IncomeFormValues,
} from "@/lib/validations/income.schema";
import { createIncomeAction, updateIncomeAction } from "@/lib/actions/income";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryIcon } from "@/components/shared/category-icon";
import type { Category, IncomeWithCategory } from "@/types/domain";

interface IncomeFormProps {
  categories: Category[];
  income?: IncomeWithCategory;
  onSuccess: () => void;
}

export function IncomeForm({ categories, income, onSuccess }: IncomeFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const defaults: IncomeFormValues = income
    ? {
        amount: (income.amount_paise / 100).toString(),
        categoryId: income.category_id,
        description: income.description ?? "",
        date: format(new Date(income.received_at), "yyyy-MM-dd"),
        time: format(new Date(income.received_at), "HH:mm"),
        isRecurring: income.is_recurring,
      }
    : {
        amount: "",
        categoryId: null,
        description: "",
        date: format(now, "yyyy-MM-dd"),
        time: format(now, "HH:mm"),
        isRecurring: false,
      };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: IncomeFormValues) {
    if (submitting) return; // guard against double-submit
    setSubmitting(true);

    try {
      const wire = formToIncomeInsertValues(values);
      if (income) {
        await updateIncomeAction(income.id, wire);
        toast.success("Income updated");
      } else {
        await createIncomeAction(wire);
        toast.success("Income added");
      }

      router.refresh();
      onSuccess();
    } catch (error) {
      logError("income-form-submit", error);
      toast.error(toFriendlyMessage(error, "Couldn't save this income. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="income-amount">Amount received</Label>
        <div className="flex items-stretch gap-2">
          <span className="gradient-income grid w-14 shrink-0 place-items-center rounded-2xl text-xl font-semibold">
            ₹
          </span>
          <Input
            id="income-amount"
            inputMode="decimal"
            placeholder="0"
            className="h-16 rounded-2xl text-3xl font-bold tabular-nums md:text-3xl"
            autoFocus
            {...register("amount")}
          />
        </div>
        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Source</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Salary, freelance, interest…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <CategoryIcon name={cat.name} icon={cat.icon} size="sm" />
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-description">Note (optional)</Label>
        <Input id="income-description" placeholder="e.g. August salary" {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="income-date">Date</Label>
          <Input id="income-date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="income-time">Time (optional)</Label>
          <Input id="income-time" type="time" {...register("time")} />
        </div>
      </div>

      <Controller
        control={control}
        name="isRecurring"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/40 px-3.5 py-3 dark:border-white/12 dark:bg-white/6">
            <div>
              <p className="text-sm font-medium">Repeats every month</p>
              <p className="text-xs text-muted-foreground">
                Marks it as regular income. It isn&apos;t added automatically yet.
              </p>
            </div>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      <Button type="submit" size="lg" className="gradient-income w-full" disabled={submitting}>
        {submitting ? "Saving…" : income ? "Save changes" : "Add income"}
      </Button>
    </form>
  );
}
