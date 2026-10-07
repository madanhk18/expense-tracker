import { createClient } from "@/lib/supabase/server";
import type { InvestmentInsertValues, SipInsertValues } from "@/lib/validations/investment.schema";
import type { Investment, RecurringInvestment } from "@/types/domain";

export async function listInvestments(limit = 200) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .select("*")
    .order("invested_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Investment[];
}

export interface InvestmentSummary {
  totalPaise: number;
  monthPaise: number;
  previousMonthPaise: number;
  byType: { name: string; paise: number }[];
}

/**
 * All-time and this-month totals plus the mix by type. Summed in JS: one
 * person's investment history is small, and this keeps the SQL minimal.
 */
export async function getInvestmentSummary(ref: Date = new Date()): Promise<InvestmentSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("investments").select("amount_paise, investment_type, invested_at");
  if (error) throw error;

  const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const nextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
  const prevStart = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);

  let totalPaise = 0;
  let monthPaise = 0;
  let previousMonthPaise = 0;
  const byType = new Map<string, number>();

  for (const row of data ?? []) {
    const at = new Date(row.invested_at);
    totalPaise += row.amount_paise;
    if (at >= monthStart && at < nextMonth) monthPaise += row.amount_paise;
    if (at >= prevStart && at < monthStart) previousMonthPaise += row.amount_paise;
    byType.set(row.investment_type, (byType.get(row.investment_type) ?? 0) + row.amount_paise);
  }

  return {
    totalPaise,
    monthPaise,
    previousMonthPaise,
    byType: [...byType.entries()].map(([name, paise]) => ({ name, paise })).sort((a, b) => b.paise - a.paise),
  };
}

export async function createInvestment(input: InvestmentInsertValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("investments").insert({ ...input, user_id: user.id });
  if (error) throw error;
}

export async function updateInvestment(id: string, input: Partial<InvestmentInsertValues>) {
  const supabase = await createClient();
  const { error } = await supabase.from("investments").update(input).eq("id", id);
  if (error) throw error;
}

export async function deleteInvestment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("investments").delete().eq("id", id);
  if (error) throw error;
}

/* ----------------------------- Repeating SIPs ----------------------------- */

export async function listRecurringInvestments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_investments")
    .select("*")
    .order("is_active", { ascending: false })
    .order("next_due_date");

  if (error) throw error;
  return (data ?? []) as RecurringInvestment[];
}

export async function createRecurringInvestment(input: SipInsertValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("recurring_investments")
    .insert({ ...input, user_id: user.id, next_due_date: input.start_date, is_active: true });
  if (error) throw error;
}

export async function setRecurringInvestmentActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_investments").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

export async function deleteRecurringInvestment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("recurring_investments").delete().eq("id", id);
  if (error) throw error;
}

/** Idempotent + dedup-safe at the DB level, like generateDueRecurringExpenses. */
export async function generateDueRecurringInvestments(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_due_recurring_investments");
  if (error) throw error;
  return data ?? 0;
}
