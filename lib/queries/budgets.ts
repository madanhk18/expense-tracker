import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";
import { startOfMonth } from "date-fns";
import type { Budget, Category } from "@/types/domain";

export async function getOverallBudget(monthRef: Date = new Date()) {
  const supabase = await createClient();
  const periodMonth = toISODate(startOfMonth(monthRef));

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("period_month", periodMonth)
    .is("category_id", null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCategoryBudgets(monthRef: Date = new Date()) {
  const supabase = await createClient();
  const periodMonth = toISODate(startOfMonth(monthRef));

  const { data, error } = await supabase
    .from("budgets")
    .select("*, category:categories(id, name, icon)")
    .eq("period_month", periodMonth)
    .not("category_id", "is", null);

  if (error) throw error;
  return (data ?? []) as unknown as (Budget & { category: Pick<Category, "id" | "name" | "icon"> | null })[];
}

/**
 * Manual check-then-write rather than `.upsert(onConflict)`: the underlying
 * unique indexes on `budgets` are partial (category_id is/is not null), and
 * PostgREST's on_conflict target must be a plain column list matching a
 * non-partial index, so upsert() would not reliably hit the right index.
 */
export async function upsertOverallBudget(amountPaise: number, monthRef: Date = new Date()) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const periodMonth = toISODate(startOfMonth(monthRef));
  const existing = await getOverallBudget(monthRef);

  const { data, error } = existing
    ? await supabase.from("budgets").update({ amount_paise: amountPaise }).eq("id", existing.id).select().single()
    : await supabase
        .from("budgets")
        .insert({ user_id: user.id, period_month: periodMonth, category_id: null, amount_paise: amountPaise })
        .select()
        .single();

  if (error) throw error;
  return data;
}

export async function upsertCategoryBudget(categoryId: string, amountPaise: number, monthRef: Date = new Date()) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const periodMonth = toISODate(startOfMonth(monthRef));
  const { data: existing, error: findError } = await supabase
    .from("budgets")
    .select("id")
    .eq("period_month", periodMonth)
    .eq("category_id", categoryId)
    .maybeSingle();
  if (findError) throw findError;

  const { data, error } = existing
    ? await supabase.from("budgets").update({ amount_paise: amountPaise }).eq("id", existing.id).select().single()
    : await supabase
        .from("budgets")
        .insert({ user_id: user.id, period_month: periodMonth, category_id: categoryId, amount_paise: amountPaise })
        .select()
        .single();

  if (error) throw error;
  return data;
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
}

/** Budget usage status used to color-code progress bars. */
export function budgetStatus(spentPaise: number, budgetPaise: number): "normal" | "warning" | "high" | "exceeded" {
  const pct = (spentPaise / budgetPaise) * 100;
  if (pct >= 100) return "exceeded";
  if (pct >= 90) return "high";
  if (pct >= 70) return "warning";
  return "normal";
}
