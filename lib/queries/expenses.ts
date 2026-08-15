import { createClient } from "@/lib/supabase/server";
import type { ExpenseInsertValues } from "@/lib/validations/expense.schema";
import type { ExpenseWithCategory } from "@/types/domain";
import type { PaymentMethod } from "@/lib/constants";

export interface ExpenseFilters {
  search?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  minPaise?: number;
  maxPaise?: number;
  sort?: "newest" | "oldest" | "amount_desc" | "amount_asc";
  page?: number;
  pageSize?: number;
}

const SELECT_WITH_CATEGORY = "*, category:categories(id, name, icon, color)";

export async function listExpenses(filters: ExpenseFilters = {}) {
  const supabase = await createClient();
  const { page = 1, pageSize = 50 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("expenses").select(SELECT_WITH_CATEGORY, { count: "exact" });

  if (filters.search) {
    const term = filters.search.replace(/[%_]/g, "");
    query = query.or(`description.ilike.%${term}%,merchant.ilike.%${term}%,notes.ilike.%${term}%`);
  }
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.paymentMethod) query = query.eq("payment_method", filters.paymentMethod);
  if (filters.dateFrom) query = query.gte("expense_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("expense_at", filters.dateTo);
  if (filters.minPaise != null) query = query.gte("amount_paise", filters.minPaise);
  if (filters.maxPaise != null) query = query.lte("amount_paise", filters.maxPaise);

  switch (filters.sort) {
    case "oldest":
      query = query.order("expense_at", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("amount_paise", { ascending: false });
      break;
    case "amount_asc":
      query = query.order("amount_paise", { ascending: true });
      break;
    default:
      query = query.order("expense_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return { expenses: (data ?? []) as unknown as ExpenseWithCategory[], total: count ?? 0 };
}

export async function getExpense(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(SELECT_WITH_CATEGORY)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as ExpenseWithCategory;
}

export async function createExpense(input: ExpenseInsertValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...input, user_id: user.id })
    .select(SELECT_WITH_CATEGORY)
    .single();

  if (error) throw error;
  return data as unknown as ExpenseWithCategory;
}

export async function updateExpense(id: string, input: Partial<ExpenseInsertValues>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .update(input)
    .eq("id", id)
    .select(SELECT_WITH_CATEGORY)
    .single();

  if (error) throw error;
  return data as unknown as ExpenseWithCategory;
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

/** Recent expenses for the dashboard's "Recent Expenses" list. */
export async function getRecentExpenses(limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(SELECT_WITH_CATEGORY)
    .order("expense_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as ExpenseWithCategory[];
}
