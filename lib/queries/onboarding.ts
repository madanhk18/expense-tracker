import { createClient } from "@/lib/supabase/server";

/**
 * How much of the app the user has actually tried — row counts per feature,
 * used by the "Get started" checklist (it ticks itself) and the Settings
 * header. Head-only count queries: no rows are transferred.
 *
 * Tables from later migrations may not exist yet; those count as 0.
 */
export interface FeatureUsage {
  expenses: number;
  income: number;
  investments: number;
  sips: number;
  lending: number;
  bills: number;
  customCategories: number;
}

type Table =
  | "expenses"
  | "income"
  | "investments"
  | "recurring_investments"
  | "lending_records"
  | "recurring_expenses"
  | "categories";

export async function getFeatureUsage(): Promise<FeatureUsage> {
  const supabase = await createClient();

  async function count(table: Table, ownOnly = false): Promise<number> {
    let query = supabase.from(table).select("id", { count: "exact", head: true });
    // System categories are visible to everyone; only count the user's own.
    if (ownOnly) query = query.not("user_id", "is", null);
    const { count: n, error } = await query;
    return error ? 0 : (n ?? 0);
  }

  const [expenses, income, investments, sips, lending, bills, customCategories] = await Promise.all([
    count("expenses"),
    count("income"),
    count("investments"),
    count("recurring_investments"),
    count("lending_records"),
    count("recurring_expenses"),
    count("categories", true),
  ]);

  return { expenses, income, investments, sips, lending, bills, customCategories };
}
