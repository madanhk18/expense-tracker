import { z } from "zod";
import { PAYMENT_METHODS, RECURRING_FREQUENCIES } from "@/lib/constants";
import { parseToPaise } from "@/lib/money";

export const recurringFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseToPaise(val) !== null, "Enter a valid amount greater than 0"),
  description: z.string().trim().min(1, "Description is required").max(200),
  categoryId: z.string().uuid().nullable().optional(),
  merchant: z.string().trim().max(200).optional().or(z.literal("")),
  paymentMethod: z.enum(PAYMENT_METHODS),
  frequency: z.enum(RECURRING_FREQUENCIES),
  intervalCount: z.number().int().min(1).max(52),
  startDate: z.string().min(1, "Start date is required"),
});

export type RecurringFormValues = z.infer<typeof recurringFormSchema>;
