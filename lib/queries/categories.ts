import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/domain";

/** System categories + the current user's own custom categories, alphabetical. */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");

  if (error) throw error;
  return data ?? [];
}

export async function createCategory(input: { name: string; icon?: string; color?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...input, user_id: user.id, is_system: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

/** Postgres "column does not exist" — i.e. 0002_income.sql hasn't been run. */
const UNDEFINED_COLUMN = "42703";

/**
 * Categories of one type. The `type` column only exists once
 * 0002_income.sql has been run, so a database still on 0001 falls back to
 * the untyped list rather than taking down every page that picks a category.
 */
async function getCategoriesOfType(type: "expense" | "income"): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("type", type).order("name");

  if (error) {
    if (error.code !== UNDEFINED_COLUMN) throw error;
    console.warn("[categories] no `type` column yet — has 0002_income.sql been run?");
    // Pre-migration every category is an expense category, and there are no
    // income categories to offer.
    return type === "expense" ? getCategories() : [];
  }

  return data ?? [];
}

/** Income-type categories only, for the income form's category picker. */
export function getIncomeCategories(): Promise<Category[]> {
  return getCategoriesOfType("income");
}

/** Expense-type categories only — what every expense-side picker should show. */
export function getExpenseCategories(): Promise<Category[]> {
  return getCategoriesOfType("expense");
}
