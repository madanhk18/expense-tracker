/**
 * Maps Supabase/Postgres/PostgREST error codes to friendly, user-facing
 * messages. Never show raw error strings (e.g. "PostgrestError: 23505...")
 * to the user — log the technical detail server-side / to console instead.
 */

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect email or password. Please try again.",
  email_not_confirmed: "Please confirm your email address before logging in.",
  user_already_exists: "An account with this email already exists.",
  weak_password: "Password is too weak. Use at least 8 characters.",
  over_request_rate_limit: "Too many attempts. Please wait a moment and try again.",
  same_password: "New password must be different from your current password.",
};

const POSTGRES_ERROR_MESSAGES: Record<string, string> = {
  "23505": "This item already exists.",
  "23503": "This action can't be completed because related data was not found.",
  "23514": "The value you entered isn't valid.",
  "42501": "You don't have permission to do that.",
};

interface KnownError {
  code?: string;
  message?: string;
  status?: number;
}

/** Convert any thrown Supabase/Postgres error into a safe, friendly message. */
export function toFriendlyMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error || typeof error !== "object") return fallback;

  const err = error as KnownError;

  if (err.code && AUTH_ERROR_MESSAGES[err.code]) {
    return AUTH_ERROR_MESSAGES[err.code];
  }

  if (err.code && POSTGRES_ERROR_MESSAGES[err.code]) {
    return POSTGRES_ERROR_MESSAGES[err.code];
  }

  // Network errors
  if (err.message?.toLowerCase().includes("fetch failed") || err.message?.toLowerCase().includes("network")) {
    return "Network error. Please check your connection and try again.";
  }

  return fallback;
}

/** Log the technical detail for debugging without leaking it to the UI. */
export function logError(context: string, error: unknown) {
  console.error(`[${context}]`, error);
}
