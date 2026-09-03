import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";
import { addDays } from "date-fns";
import type { RecurringFrequency, PaymentMethod } from "@/lib/constants";
import type { RecurringExpense, Category } from "@/types/domain";

export interface RecurringInput {
  amount_paise: number;
  description: string;
  category_id: string | null;
  merchant: string | null;
  payment_method: PaymentMethod;
  frequency: RecurringFrequency;
  interval_count: number;
  start_date: string; // yyyy-MM-dd
}

export async function listRecurringExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*, category:categories(id, name, icon)")
    .order("next_due_date");

  if (error) throw error;
  return (data ?? []) as unknown as (RecurringExpense & { category: Pick<Category, "id" | "name" | "icon"> | null })[];
}

export async function createRecurringExpense(input: RecurringInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("recurring_expenses")
    .insert({ ...input, user_id: user.id, next_due_date: input.start_date, is_active: true })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateRecurringExpense(id: string, input: Partial<RecurringInput> & { is_active?: boolean }) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("recurring_expenses").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRecurringExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
  if (error) throw error;
}

export interface UpcomingBill {
  id: string;
  description: string;
  amountPaise: number;
  nextDueDate: string; // yyyy-MM-dd
  categoryName: string | null;
}

/**
 * Active recurring expenses due within `withinDays` days (default 3),
 * including any already overdue (next_due_date in the past but not yet
 * generated — this can happen between dashboard visits). Computed live on
 * every call; no alerts table, no cron. Sorted soonest-due first.
 */
export async function listUpcomingBills(withinDays = 3): Promise<UpcomingBill[]> {
  const supabase = await createClient();
  const cutoff = toISODate(addDays(new Date(), withinDays));

  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("id, description, amount_paise, next_due_date, category:categories(name)")
    .eq("is_active", true)
    .lte("next_due_date", cutoff)
    .order("next_due_date", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as Array<{
    id: string;
    description: string;
    amount_paise: number;
    next_due_date: string;
    category: { name: string } | null;
  }>).map((row) => ({
    id: row.id,
    description: row.description,
    amountPaise: row.amount_paise,
    nextDueDate: row.next_due_date,
    categoryName: row.category?.name ?? null,
  }));
}
