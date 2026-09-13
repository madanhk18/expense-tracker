import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";
import type { IncomeInsertValues } from "@/lib/validations/income.schema";
import type { IncomeWithCategory, IncomeStats } from "@/types/domain";

export interface IncomeFilters {
  categoryId?: string;
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  sort?: "newest" | "oldest" | "amount_desc" | "amount_asc";
  page?: number;
  pageSize?: number;
}

const SELECT_WITH_CATEGORY = "*, category:categories(id, name, icon, color)";

export async function listIncome(filters: IncomeFilters = {}) {
  const supabase = await createClient();
  const { page = 1, pageSize = 50 } = filters;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("income").select(SELECT_WITH_CATEGORY, { count: "exact" });

  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.dateFrom) query = query.gte("received_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("received_at", filters.dateTo);

  switch (filters.sort) {
    case "oldest":
      query = query.order("received_at", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("amount_paise", { ascending: false });
      break;
    case "amount_asc":
      query = query.order("amount_paise", { ascending: true });
      break;
    default:
      query = query.order("received_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return { income: (data ?? []) as unknown as IncomeWithCategory[], total: count ?? 0 };
}

export async function getIncome(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("income").select(SELECT_WITH_CATEGORY).eq("id", id).single();
  if (error) throw error;
  return data as unknown as IncomeWithCategory;
}

export async function createIncome(input: IncomeInsertValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("income")
    .insert({ ...input, user_id: user.id })
    .select(SELECT_WITH_CATEGORY)
    .single();

  if (error) throw error;
  return data as unknown as IncomeWithCategory;
}

export async function updateIncome(id: string, input: Partial<IncomeInsertValues>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income")
    .update(input)
    .eq("id", id)
    .select(SELECT_WITH_CATEGORY)
    .single();

  if (error) throw error;
  return data as unknown as IncomeWithCategory;
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("income").delete().eq("id", id);
  if (error) throw error;
}

export async function getRecentIncome(limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income")
    .select(SELECT_WITH_CATEGORY)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as IncomeWithCategory[];
}

/** One round trip via the get_income_stats RPC (see 0002_income.sql). */
export async function getIncomeStats(refDate: Date = new Date()): Promise<IncomeStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_income_stats", { ref_date: toISODate(refDate) });

  if (error) throw error;
  const row = data?.[0];

  return {
    todayIncomePaise: row?.today_income_paise ?? 0,
    weekIncomePaise: row?.week_income_paise ?? 0,
    monthIncomePaise: row?.month_income_paise ?? 0,
    previousMonthIncomePaise: row?.previous_month_income_paise ?? 0,
    monthExpensePaise: row?.month_expense_paise ?? 0,
    savingsRatePercent: row?.savings_rate_percent ?? null,
  };
}
