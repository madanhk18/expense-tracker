import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { paiseToPlainRupees } from "@/lib/money";
import { toCsv } from "@/lib/csv";

/**
 * GET /api/export?kind=expenses|income|savings|lending — the signed-in
 * user's data as a CSV download. RLS scopes every query to that user.
 */

const PAGE = 1000; // PostgREST's default max rows per request

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

const when = (iso: string) => format(new Date(iso), "yyyy-MM-dd HH:mm");

const EXPORTS: Record<string, (supabase: Supabase) => Promise<string>> = {
  async expenses(supabase) {
    type Row = {
      expense_at: string;
      description: string;
      amount_paise: number;
      payment_method: string;
      merchant: string | null;
      notes: string | null;
      category: { name: string } | null;
    };
    const rows = await fetchAll<Row>((from, to) =>
      supabase
        .from("expenses")
        .select("expense_at, description, amount_paise, payment_method, merchant, notes, category:categories(name)")
        .order("expense_at", { ascending: false })
        .range(from, to)
        .then((r) => ({ data: r.data as unknown as Row[] | null, error: r.error }))
    );
    return toCsv(
      ["Date", "Description", "Category", "Amount (INR)", "Payment method", "Merchant", "Notes"],
      rows.map((r) => [when(r.expense_at), r.description, r.category?.name, paiseToPlainRupees(r.amount_paise), r.payment_method, r.merchant, r.notes])
    );
  },

  async income(supabase) {
    type Row = { received_at: string; description: string | null; amount_paise: number; is_recurring: boolean; category: { name: string } | null };
    const rows = await fetchAll<Row>((from, to) =>
      supabase
        .from("income")
        .select("received_at, description, amount_paise, is_recurring, category:categories(name)")
        .order("received_at", { ascending: false })
        .range(from, to)
        .then((r) => ({ data: r.data as unknown as Row[] | null, error: r.error }))
    );
    return toCsv(
      ["Date", "Source", "Note", "Amount (INR)", "Monthly"],
      rows.map((r) => [when(r.received_at), r.category?.name, r.description, paiseToPlainRupees(r.amount_paise), r.is_recurring ? "Yes" : "No"])
    );
  },

  async savings(supabase) {
    const rows = await fetchAll((from, to) =>
      supabase
        .from("investments")
        .select("invested_at, investment_type, name, amount_paise, notes, recurring_investment_id")
        .order("invested_at", { ascending: false })
        .range(from, to)
    );
    return toCsv(
      ["Date", "Type", "Name", "Amount (INR)", "Auto (SIP)", "Notes"],
      rows.map((r) => [when(r.invested_at), r.investment_type, r.name, paiseToPlainRupees(r.amount_paise), r.recurring_investment_id ? "Yes" : "No", r.notes])
    );
  },

  async lending(supabase) {
    type Row = {
      lent_at: string;
      person_name: string;
      direction: string;
      amount_paise: number;
      description: string | null;
      due_date: string | null;
      settlements: { amount_paise: number }[] | null;
    };
    const rows = await fetchAll<Row>((from, to) =>
      supabase
        .from("lending_records")
        .select("lent_at, person_name, direction, amount_paise, description, due_date, settlements:lending_settlements(amount_paise)")
        .order("lent_at", { ascending: false })
        .range(from, to)
        .then((r) => ({ data: r.data as unknown as Row[] | null, error: r.error }))
    );
    return toCsv(
      ["Date", "Person", "Direction", "Amount (INR)", "Paid back (INR)", "Still open (INR)", "Pay back by", "Note"],
      rows.map((r) => {
        const paid = (r.settlements ?? []).reduce((s, x) => s + x.amount_paise, 0);
        return [
          when(r.lent_at),
          r.person_name,
          r.direction === "lent" ? "You gave" : "You took",
          paiseToPlainRupees(r.amount_paise),
          paiseToPlainRupees(paid),
          paiseToPlainRupees(Math.max(0, r.amount_paise - paid)),
          r.due_date,
          r.description,
        ];
      })
    );
  },
};

export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind") ?? "";
  const build = EXPORTS[kind];
  if (!build) return new Response("Unknown export", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Not signed in", { status: 401 });

  try {
    const csv = await build(supabase);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${kind}-${format(new Date(), "yyyy-MM-dd")}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[export]", kind, error);
    return new Response("Export failed", { status: 500 });
  }
}
