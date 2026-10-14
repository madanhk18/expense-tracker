import { addDays, addMonths, addWeeks, addYears, format, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import type { RecurringFrequency } from "@/lib/constants";
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

/** Creates the rule and returns its id. `nextDueDate` defaults to the start date. */
export async function createRecurringInvestment(input: SipInsertValues, nextDueDate = input.start_date) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("recurring_investments")
    .insert({ ...input, user_id: user.id, next_due_date: nextDueDate, is_active: true })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
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

/* --------------------------- Double-entry guard --------------------------- */

/** How close (in days) two same-amount payments must be to look like one. */
const SAME_PAYMENT_WINDOW_DAYS = 3;

/** The due date after `date` for a rule of this frequency (yyyy-MM-dd in, out). */
export function nextDueAfter(date: string, frequency: RecurringFrequency, intervalCount = 1): string {
  const d = parseISO(date);
  const next =
    frequency === "weekly"
      ? addWeeks(d, intervalCount)
      : frequency === "yearly"
        ? addYears(d, intervalCount)
        : addMonths(d, intervalCount);
  return format(next, "yyyy-MM-dd");
}

/**
 * A manually logged investment of the same amount within a few days of
 * `date` — probably the same payment a new SIP is about to generate.
 */
export async function findManualPaymentNear(amountPaise: number, date: string) {
  const supabase = await createClient();
  const d = parseISO(date);
  const { data, error } = await supabase
    .from("investments")
    .select("id, name, invested_at")
    .is("recurring_investment_id", null)
    .eq("amount_paise", amountPaise)
    .gte("invested_at", addDays(d, -SAME_PAYMENT_WINDOW_DAYS).toISOString())
    .lte("invested_at", addDays(d, SAME_PAYMENT_WINDOW_DAYS + 1).toISOString())
    .order("invested_at")
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * An active SIP of the same amount whose next payment falls within a few
 * days of `investedAt` — logging this by hand would count it twice.
 */
export async function findSipDueNear(amountPaise: number, investedAt: string) {
  const supabase = await createClient();
  const d = new Date(investedAt);
  const { data, error } = await supabase
    .from("recurring_investments")
    .select("id, name, next_due_date")
    .eq("is_active", true)
    .eq("amount_paise", amountPaise)
    .gte("next_due_date", format(addDays(d, -SAME_PAYMENT_WINDOW_DAYS), "yyyy-MM-dd"))
    .lte("next_due_date", format(addDays(d, SAME_PAYMENT_WINDOW_DAYS), "yyyy-MM-dd"))
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

/** Mark a hand-logged payment as the SIP's own (so it shows as Auto). */
export async function linkPaymentToSip(investmentId: string, ruleId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("investments")
    .update({ recurring_investment_id: ruleId })
    .eq("id", investmentId);
  if (error) throw error;
}
