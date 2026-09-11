const DEFAULT_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";

/** Format an integer amount in cents as a currency string (e.g. 1234 → "$12.34"). */
export function formatCurrency(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

/**
 * Parse a user-entered amount string into an integer number of cents.
 *
 * Accepts an optional "$" prefix, thousand separators, surrounding whitespace
 * and up to two decimal places (e.g. "1,234.56" → 123456, "$12.34" → 1234).
 * Returns `null` for empty or unparseable input.
 */
export function parseAmount(input: string): number | null {
  if (typeof input !== "string") return null;
  const cleaned = input.trim().replace(/[$,\s]/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const [rawWhole, rawFraction = "0"] = cleaned.split(".");
  if (rawFraction.length > 2) return null;
  const negative = rawWhole.startsWith("-");
  const whole = negative ? rawWhole.slice(1) : rawWhole;
  const cents = Number(`${whole}${rawFraction.padEnd(2, "0")}`);
  return negative ? -cents : cents;
}