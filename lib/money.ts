/**
 * Money handling — INR stored as integer paise everywhere except at the
 * UI boundary. Never do float arithmetic on rupee values.
 *
 * 1 rupee = 100 paise. ₹1,234.56 -> 123456 paise (bigint-safe as a JS number
 * up to 2^53-1, far beyond any personal-finance amount).
 */

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const INR_FORMATTER_NO_DECIMALS = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Format integer paise as a display string, e.g. 123456 -> "₹1,234.56" */
export function formatINR(paise: number, opts?: { decimals?: boolean }): string {
  const rupees = paise / 100;
  const showDecimals = opts?.decimals ?? paise % 100 !== 0;
  return (showDecimals ? INR_FORMATTER : INR_FORMATTER_NO_DECIMALS).format(rupees);
}

/**
 * Parse a user-entered rupee string (e.g. "1234.56", "1,234.56", "₹450") into
 * integer paise. Returns null if the input isn't a valid positive amount.
 */
export function parseToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (cleaned === "" || Number.isNaN(Number(cleaned))) return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;

  // Round to avoid float artifacts (e.g. 19.99 * 100 = 1998.9999999998)
  return Math.round(value * 100);
}

/** Convert integer paise to a plain rupee number for editing in a form input. */
export function paiseToRupeeInput(paise: number): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}

/** Convert a rupee number (already validated) to integer paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}
