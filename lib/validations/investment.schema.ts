import { z } from "zod";
import { INVESTMENT_TYPES, RECURRING_FREQUENCIES } from "@/lib/constants";
import { parseToPaise } from "@/lib/money";

const amount = z
  .string()
  .min(1, "Amount is required")
  .refine((val) => parseToPaise(val) !== null, "Enter a valid amount greater than 0");

/** Form-shape schema for a one-off investment (rupees as string). */
export const investmentFormSchema = z.object({
  amount,
  investmentType: z.enum(INVESTMENT_TYPES),
  name: z.string().trim().min(1, "Give it a name, e.g. Axis Bluechip").max(120),
  date: z.string().min(1, "Date is required"), // yyyy-MM-dd
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

/** Wire shape sent to Supabase. */
export const investmentInsertSchema = z.object({
  amount_paise: z.number().int().positive(),
  investment_type: z.enum(INVESTMENT_TYPES),
  name: z.string().trim().min(1).max(120),
  invested_at: z.string(),
  notes: z.string().trim().max(500).nullable(),
});

export type InvestmentInsertValues = z.infer<typeof investmentInsertSchema>;

export function formToInvestmentInsertValues(values: InvestmentFormValues): InvestmentInsertValues {
  const paise = parseToPaise(values.amount);
  if (paise === null) throw new Error("Invalid amount");

  return {
    amount_paise: paise,
    investment_type: values.investmentType,
    name: values.name,
    // Midday keeps the calendar date stable across timezones.
    invested_at: new Date(`${values.date}T12:00:00`).toISOString(),
    notes: values.notes ? values.notes : null,
  };
}

/** Form-shape schema for a repeating SIP rule. */
export const sipFormSchema = z.object({
  amount,
  investmentType: z.enum(INVESTMENT_TYPES),
  name: z.string().trim().min(1, "Give it a name, e.g. Axis Bluechip").max(120),
  frequency: z.enum(RECURRING_FREQUENCIES),
  startDate: z.string().min(1, "Start date is required"),
});

export type SipFormValues = z.infer<typeof sipFormSchema>;

export const sipInsertSchema = z.object({
  amount_paise: z.number().int().positive(),
  investment_type: z.enum(INVESTMENT_TYPES),
  name: z.string().trim().min(1).max(120),
  frequency: z.enum(RECURRING_FREQUENCIES),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type SipInsertValues = z.infer<typeof sipInsertSchema>;

export function formToSipInsertValues(values: SipFormValues): SipInsertValues {
  const paise = parseToPaise(values.amount);
  if (paise === null) throw new Error("Invalid amount");

  return {
    amount_paise: paise,
    investment_type: values.investmentType,
    name: values.name,
    frequency: values.frequency,
    start_date: values.startDate,
  };
}
