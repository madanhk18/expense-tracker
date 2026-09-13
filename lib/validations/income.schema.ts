import { z } from "zod";
import { parseToPaise } from "@/lib/money";

/** Form-shape schema — what the income form actually collects (rupees as string). */
export const incomeFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseToPaise(val) !== null, "Enter a valid amount greater than 0"),
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"), // yyyy-MM-dd
  time: z.string().optional().or(z.literal("")), // HH:mm
  isRecurring: z.boolean(),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

/** Wire-shape schema — what actually gets sent to Supabase (amount as integer paise). */
export const incomeInsertSchema = z.object({
  amount_paise: z.number().int().positive(),
  category_id: z.string().uuid().nullable(),
  description: z.string().trim().max(200).nullable(),
  received_at: z.string(), // ISO timestamp
  is_recurring: z.boolean(),
});

export type IncomeInsertValues = z.infer<typeof incomeInsertSchema>;

/** Convert validated form values into the wire shape sent to Supabase. */
export function formToIncomeInsertValues(values: IncomeFormValues): IncomeInsertValues {
  const paise = parseToPaise(values.amount);
  if (paise === null) throw new Error("Invalid amount");

  const time = values.time && values.time.length > 0 ? values.time : "00:00";
  const receivedAt = new Date(`${values.date}T${time}:00`);

  return {
    amount_paise: paise,
    category_id: values.categoryId || null,
    description: values.description ? values.description : null,
    received_at: receivedAt.toISOString(),
    is_recurring: values.isRecurring,
  };
}
