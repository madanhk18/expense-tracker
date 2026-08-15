import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";
import type { DashboardStats } from "@/types/domain";

/** One round-trip via the get_dashboard_stats RPC (see 0001_init.sql). */
export async function getDashboardStats(refDate: Date = new Date()): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dashboard_stats", {
    ref_date: toISODate(refDate),
  });

  if (error) throw error;
  const row = data?.[0];

  return {
    todayPaise: row?.today_paise ?? 0,
    weekPaise: row?.week_paise ?? 0,
    monthPaise: row?.month_paise ?? 0,
    previousMonthPaise: row?.previous_month_paise ?? 0,
    monthTransactionCount: row?.month_transaction_count ?? 0,
    avgDailyPaise: row?.avg_daily_paise ?? 0,
    highestExpensePaise: row?.highest_expense_paise ?? 0,
  };
}

/** Runs the recurring-expense generator RPC, idempotent + dedup-safe. Call once on dashboard load. */
export async function generateDueRecurringExpenses(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_due_recurring_expenses");
  if (error) throw error;
  return data ?? 0;
}

export function momChangePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
