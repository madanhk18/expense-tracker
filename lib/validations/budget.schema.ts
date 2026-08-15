import { z } from "zod";
import { parseToPaise } from "@/lib/money";

export const budgetFormSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => parseToPaise(val) !== null, "Enter a valid amount greater than 0"),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
