import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

/**
 * Per-user app preferences. Stored in the Supabase auth user's metadata
 * (`user_metadata.preferences`) so they need no table or migration, and
 * travel with the account across devices.
 */
export const preferencesSchema = z.object({
  defaultPaymentMethod: z.enum(PAYMENT_METHODS),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  defaultPaymentMethod: "UPI",
};

/** Read preferences out of user metadata, falling back field by field. */
export function parsePreferences(metadata: unknown): Preferences {
  const raw = (metadata as { preferences?: Record<string, unknown> } | null)?.preferences ?? {};
  const result = preferencesSchema.partial().safeParse(raw);
  return { ...DEFAULT_PREFERENCES, ...(result.success ? result.data : {}) };
}
