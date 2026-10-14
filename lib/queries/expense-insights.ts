import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { buildExpenseInsights, type InsightRow } from "@/lib/expense-insights";

/** The month's rows plus last month's total, then the pure builder. */
export async function getExpenseInsights(monthRef: Date) {
  const supabase = await createClient();
  const start = startOfMonth(monthRef);
  const end = endOfMonth(monthRef);
  const prev = subMonths(start, 1);

  const [current, previous] = await Promise.all([
    supabase
      .from("expenses")
      .select("amount_paise, expense_at, description, category:categories(name, icon)")
      .gte("expense_at", start.toISOString())
      .lte("expense_at", end.toISOString()),
    supabase
      .from("expenses")
      .select("amount_paise")
      .gte("expense_at", startOfMonth(prev).toISOString())
      .lte("expense_at", endOfMonth(prev).toISOString()),
  ]);
  if (current.error) throw current.error;
  if (previous.error) throw previous.error;

  return {
    ...buildExpenseInsights((current.data ?? []) as unknown as InsightRow[], monthRef),
    previousMonthPaise: (previous.data ?? []).reduce((sum, r) => sum + r.amount_paise, 0),
  };
}
