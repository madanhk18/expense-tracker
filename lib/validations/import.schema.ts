import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

/** Expected CSV columns match the export format exactly (see lib/export.ts). */
export const importRowSchema = z.object({
  Date: z.string().min(1, "Date is required"),
  Time: z.string().optional().default(""),
  Item: z.string().min(1, "Item is required"),
  Category: z.string().optional().default(""),
  Merchant: z.string().optional().default(""),
  "Payment Method": z.enum(PAYMENT_METHODS).catch("Other" as (typeof PAYMENT_METHODS)[number]),
  Amount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isFinite(v) && v > 0, "Amount must be a positive number"),
  Notes: z.string().optional().default(""),
});

export type ImportRow = z.infer<typeof importRowSchema>;

export interface ValidatedImportRow {
  index: number;
  raw: Record<string, string>;
  valid: boolean;
  error?: string;
  parsed?: ImportRow;
}

/** Validate parsed CSV rows without inserting anything — used to render the preview table. */
export function validateImportRows(rows: Record<string, string>[]): ValidatedImportRow[] {
  return rows.map((raw, index) => {
    const result = importRowSchema.safeParse(raw);
    if (!result.success) {
      return { index, raw, valid: false, error: result.error.issues[0]?.message ?? "Invalid row" };
    }
    return { index, raw, valid: true, parsed: result.data };
  });
}
