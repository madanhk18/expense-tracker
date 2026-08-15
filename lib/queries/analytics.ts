import { createClient } from "@/lib/supabase/server";
import { toISODate } from "@/lib/dates";
import { format } from "date-fns";

interface RawRow {
  amount_paise: number;
  expense_at: string;
  merchant: string | null;
  payment_method: string;
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
}

/**
 * Fetches all expenses in [start, end] once, then derives every breakdown
 * (category / payment method / merchant / time series) from that single
 * result set in memory. Personal-finance datasets (thousands of rows/user)
 * are small enough that this avoids N separate grouped-aggregate queries
 * while still deriving every number live from the source rows.
 */
async function fetchRange(start: Date, end: Date): Promise<RawRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("amount_paise, expense_at, merchant, payment_method, category:categories(id, name, icon, color)")
    .gte("expense_at", start.toISOString())
    .lte("expense_at", end.toISOString());

  if (error) throw error;
  return (data ?? []) as unknown as RawRow[];
}

export async function getAnalytics(start: Date, end: Date, granularity: "day" | "week" | "month" = "day") {
  const rows = await fetchRange(start, end);

  const totalPaise = rows.reduce((sum, r) => sum + r.amount_paise, 0);

  const byCategory = new Map<string, { name: string; icon: string | null; paise: number }>();
  const byPaymentMethod = new Map<string, number>();
  const byMerchant = new Map<string, number>();
  const bySeries = new Map<string, number>();

  for (const row of rows) {
    const catKey = row.category?.id ?? "uncategorized";
    const catEntry = byCategory.get(catKey) ?? {
      name: row.category?.name ?? "Uncategorized",
      icon: row.category?.icon ?? null,
      paise: 0,
    };
    catEntry.paise += row.amount_paise;
    byCategory.set(catKey, catEntry);

    byPaymentMethod.set(row.payment_method, (byPaymentMethod.get(row.payment_method) ?? 0) + row.amount_paise);

    if (row.merchant) {
      byMerchant.set(row.merchant, (byMerchant.get(row.merchant) ?? 0) + row.amount_paise);
    }

    const date = new Date(row.expense_at);
    const bucketKey =
      granularity === "day"
        ? format(date, "yyyy-MM-dd")
        : granularity === "week"
          ? format(date, "yyyy-'W'ww")
          : format(date, "yyyy-MM");
    bySeries.set(bucketKey, (bySeries.get(bucketKey) ?? 0) + row.amount_paise);
  }

  return {
    totalPaise,
    transactionCount: rows.length,
    categoryBreakdown: [...byCategory.entries()]
      .map(([id, v]) => ({ categoryId: id, name: v.name, icon: v.icon, paise: v.paise }))
      .sort((a, b) => b.paise - a.paise),
    paymentMethodBreakdown: [...byPaymentMethod.entries()]
      .map(([method, paise]) => ({ method, paise }))
      .sort((a, b) => b.paise - a.paise),
    topMerchants: [...byMerchant.entries()]
      .map(([merchant, paise]) => ({ merchant, paise }))
      .sort((a, b) => b.paise - a.paise)
      .slice(0, 10),
    series: [...bySeries.entries()].map(([bucket, paise]) => ({ bucket, paise })).sort((a, b) => (a.bucket < b.bucket ? -1 : 1)),
  };
}

export async function getMonthComparison(currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date) {
  const [current, previous] = await Promise.all([
    fetchRange(currentStart, currentEnd),
    fetchRange(previousStart, previousEnd),
  ]);

  const currentPaise = current.reduce((sum, r) => sum + r.amount_paise, 0);
  const previousPaise = previous.reduce((sum, r) => sum + r.amount_paise, 0);
  const diffPaise = currentPaise - previousPaise;
  const percentChange = previousPaise === 0 ? null : (diffPaise / previousPaise) * 100;

  return { currentPaise, previousPaise, diffPaise, percentChange };
}

export { toISODate };
