import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

/**
 * Per-user app preferences. Stored in the Supabase auth user's metadata
 * (`user_metadata.preferences`) so they need no table or migration, and
 * travel with the account across devices.
 */
export const BILL_REMINDER_DAYS = [1, 3, 7, 14] as const;

export const preferencesSchema = z.object({
  defaultPaymentMethod: z.enum(PAYMENT_METHODS),
  billReminderDays: z.union([z.literal(1), z.literal(3), z.literal(7), z.literal(14)]),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  defaultPaymentMethod: "UPI",
  billReminderDays: 3,
};

/** Read preferences out of user metadata, falling back field by field. */
export function parsePreferences(metadata: unknown): Preferences {
  const raw = (metadata as { preferences?: Record<string, unknown> } | null)?.preferences ?? {};
  const result = preferencesSchema.partial().safeParse(raw);
  return { ...DEFAULT_PREFERENCES, ...(result.success ? result.data : {}) };
}
