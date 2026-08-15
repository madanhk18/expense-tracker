import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { expensesToCSV, expensesToJSON } from "@/lib/export";
import type { ExpenseWithCategory } from "@/types/domain";

/**
 * Server-side, RLS-scoped export. Uses the cookie-based Supabase client
 * (never the service-role key), so the query is automatically restricted
 * to the logged-in user's own expenses.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "json" ? "json" : "csv";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*, category:categories(id, name, icon, color)")
    .order("expense_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to export expenses" }, { status: 500 });
  }

  const expenses = (data ?? []) as unknown as ExpenseWithCategory[];

  if (format === "json") {
    return new NextResponse(expensesToJSON(expenses), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="expenses.json"',
      },
    });
  }

  return new NextResponse(expensesToCSV(expenses), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="expenses.csv"',
    },
  });
}
