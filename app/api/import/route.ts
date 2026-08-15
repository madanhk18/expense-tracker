import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { importRowSchema } from "@/lib/validations/import.schema";
import { rupeesToPaise } from "@/lib/money";
import { z } from "zod";

const bodySchema = z.object({ rows: z.array(z.record(z.string(), z.string())).max(2000) });

/**
 * Never blindly insert malformed data: every row is re-validated server-side
 * (the client-side preview is UX only, not a trust boundary), category names
 * are resolved against the user's actual categories, and the whole import
 * runs as one insert scoped by RLS to the current user.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { data: categories } = await supabase.from("categories").select("id, name").or(`user_id.eq.${user.id},user_id.is.null`);
  const categoryByName = new Map((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]));

  let inserted = 0;
  const errors: { index: number; error: string }[] = [];

  for (const [index, raw] of body.data.rows.entries()) {
    const parsed = importRowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({ index, error: parsed.error.issues[0]?.message ?? "Invalid row" });
      continue;
    }

    const row = parsed.data;
    const expenseAt = new Date(`${row.Date}T${row.Time || "00:00"}:00`);
    if (Number.isNaN(expenseAt.getTime())) {
      errors.push({ index, error: "Invalid date/time" });
      continue;
    }

    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount_paise: rupeesToPaise(row.Amount),
      description: row.Item,
      category_id: row.Category ? (categoryByName.get(row.Category.toLowerCase()) ?? null) : null,
      merchant: row.Merchant || null,
      payment_method: row["Payment Method"],
      expense_at: expenseAt.toISOString(),
      notes: row.Notes || null,
    });

    if (error) {
      errors.push({ index, error: "Failed to save this row" });
    } else {
      inserted++;
    }
  }

  return NextResponse.json({ inserted, errors });
}
