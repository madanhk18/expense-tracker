"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { expenseFormSchema, formToInsertValues, type ExpenseFormValues } from "@/lib/validations/expense.schema";
import { createClient } from "@/lib/supabase/client";
import { toFriendlyMessage, logError } from "@/lib/errors";
import { PAYMENT_METHODS } from "@/lib/constants";
import { paymentStyle } from "@/lib/category-style";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryIcon } from "@/components/shared/category-icon";
import type { Category, ExpenseWithCategory } from "@/types/domain";

interface ExpenseFormProps {
  categories: Category[];
  expense?: ExpenseWithCategory;
  onSuccess: () => void;
}

export function ExpenseForm({ categories, expense, onSuccess }: ExpenseFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const defaults: ExpenseFormValues = expense
    ? {
        amount: (expense.amount_paise / 100).toString(),
        description: expense.description,
        categoryId: expense.category_id ?? undefined,
        merchant: expense.merchant ?? "",
        paymentMethod: expense.payment_method,
        date: format(new Date(expense.expense_at), "yyyy-MM-dd"),
        time: format(new Date(expense.expense_at), "HH:mm"),
        notes: expense.notes ?? "",
      }
    : {
        amount: "",
        description: "",
        categoryId: undefined,
        merchant: "",
        paymentMethod: "UPI",
        date: format(now, "yyyy-MM-dd"),
        time: format(now, "HH:mm"),
        notes: "",
      };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: ExpenseFormValues) {
    if (submitting) return; // guard against double-submit
    setSubmitting(true);

    try {
      const wire = formToInsertValues(values);
      const supabase = createClient();

      if (expense) {
        const { error } = await supabase.from("expenses").update(wire).eq("id", expense.id);
        if (error) throw error;
        toast.success("Expense updated");
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase.from("expenses").insert({ ...wire, user_id: user.id });
        if (error) throw error;
        toast.success("Expense added");
      }

      router.refresh();
      onSuccess();
    } catch (error) {
      logError("expense-form-submit", error);
      toast.error(toFriendlyMessage(error, "Couldn't save your expense. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="flex items-stretch gap-2">
          <span className="btn-solid grid w-14 shrink-0 place-items-center rounded-xl text-xl font-semibold">
            ₹
          </span>
          <Input
            id="amount"
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
        <Label htmlFor="description">Item / Description</Label>
        <Input id="description" placeholder="e.g. Lunch, Amazon order" {...register("description")} />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
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
        <Label>Payment method</Label>
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const pm = paymentStyle(method);
                const selected = field.value === method;
                return (
                  <button
                    key={method}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => field.onChange(method)}
                    style={
                      {
                        "--tint": pm.color,
                        borderColor: selected
                          ? `color-mix(in oklch, ${pm.color} 55%, transparent)`
                          : undefined,
                      } as React.CSSProperties
                    }
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition-all active:scale-[0.97]",
                      selected
                        ? "surface-tint text-foreground shadow-[0_8px_20px_-12px_var(--tint)]"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <pm.icon className="size-4" style={{ color: pm.color }} />
                    <span className="truncate">{method}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="merchant">Where / Merchant (optional)</Label>
        <Input id="merchant" placeholder="e.g. Amazon, Swiggy" {...register("merchant")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time (optional)</Label>
          <Input id="time" type="time" {...register("time")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" rows={2} placeholder="Any extra detail…" {...register("notes")} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : expense ? "Save changes" : "Add expense"}
      </Button>
    </form>
  );
}
