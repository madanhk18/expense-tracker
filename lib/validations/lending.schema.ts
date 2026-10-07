import { z } from "zod";
import { LENDING_DIRECTIONS } from "@/lib/constants";
import { parseToPaise } from "@/lib/money";

const amount = z
  .string()
  .min(1, "Amount is required")
  .refine((val) => parseToPaise(val) !== null, "Enter a valid amount greater than 0");

/** Form-shape schema for "I gave / I took money". */
export const lendingFormSchema = z.object({
  amount,
  direction: z.enum(LENDING_DIRECTIONS),
  personName: z.string().trim().min(1, "Who was it?").max(80),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().optional().or(z.literal("")),
});

export type LendingFormValues = z.infer<typeof lendingFormSchema>;

export const lendingInsertSchema = z.object({
  amount_paise: z.number().int().positive(),
  direction: z.enum(LENDING_DIRECTIONS),
  person_name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(200).nullable(),
  lent_at: z.string(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export type LendingInsertValues = z.infer<typeof lendingInsertSchema>;

export function formToLendingInsertValues(values: LendingFormValues): LendingInsertValues {
  const paise = parseToPaise(values.amount);
  if (paise === null) throw new Error("Invalid amount");

  return {
    amount_paise: paise,
    direction: values.direction,
    person_name: values.personName,
    description: values.description ? values.description : null,
    lent_at: new Date(`${values.date}T12:00:00`).toISOString(),
    due_date: values.dueDate ? values.dueDate : null,
  };
}

/** A repayment against one record. The upper bound is checked server-side. */
export const settlementFormSchema = z.object({
  amount,
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export type SettlementFormValues = z.infer<typeof settlementFormSchema>;
