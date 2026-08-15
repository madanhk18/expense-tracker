import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";
import { parseToPaise } from "@/lib/money";

/** Form-shape schema — what the expense form actually collects (rupees as string). */
export const expenseFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseToPaise(val) !== null, "Enter a valid amount greater than 0"),
  description: z.string().trim().min(1, "Description is required").max(200),
  categoryId: z.string().uuid().nullable().optional(),
  merchant: z.string().trim().max(200).optional().or(z.literal("")),
  paymentMethod: z.enum(PAYMENT_METHODS),
  date: z.string().min(1, "Date is required"), // yyyy-MM-dd
  time: z.string().optional().or(z.literal("")), // HH:mm
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

/** Wire-shape schema — what actually gets sent to Supabase (amount as integer paise). */
export const expenseInsertSchema = z.object({
  amount_paise: z.number().int().positive(),
  description: z.string().trim().min(1).max(200),
  category_id: z.string().uuid().nullable(),
  merchant: z.string().trim().max(200).nullable(),
  payment_method: z.enum(PAYMENT_METHODS),
  expense_at: z.string(), // ISO timestamp
  notes: z.string().trim().max(2000).nullable(),
});

export type ExpenseInsertValues = z.infer<typeof expenseInsertSchema>;

/** Convert validated form values into the wire shape sent to Supabase. */
export function formToInsertValues(values: ExpenseFormValues): ExpenseInsertValues {
  const paise = parseToPaise(values.amount);
  if (paise === null) throw new Error("Invalid amount");

  const time = values.time && values.time.length > 0 ? values.time : "00:00";
  const expenseAt = new Date(`${values.date}T${time}:00`);

  return {
    amount_paise: paise,
    description: values.description,
    category_id: values.categoryId || null,
    merchant: values.merchant ? values.merchant : null,
    payment_method: values.paymentMethod,
    expense_at: expenseAt.toISOString(),
    notes: values.notes ? values.notes : null,
  };
}
