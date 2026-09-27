const DEFAULT_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";

/** ISO `YYYY-MM-DD`, the calendar date format used by `occurredOn`. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const MILLISECONDS_PER_DAY = 86_400_000;

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

/** Whole days since the epoch for an ISO date, or `null` when it isn't one. */
function toDayNumber(value: string): number | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(time) ? null : time / MILLISECONDS_PER_DAY;
}

/**
 * A short absolute label for an ISO date, e.g. `"Fri, 12 Sep"`. The year is
 * added when it differs from the reference year, and an unparseable value is
 * returned untouched rather than throwing.
 */
function absoluteDateLabel(
  date: string,
  referenceDate: string,
  locale: string,
): string {
  const time = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(time)) return date;

  const sameYear =
    ISO_DATE_PATTERN.test(referenceDate) && date.slice(0, 4) === referenceDate.slice(0, 4);

  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  }).format(new Date(time));
}

/**
 * A human label for the day a transaction happened on, relative to a reference
 * day: the same day is `"Today"`, the day before is `"Yesterday"`, and any
 * other day falls back to a short absolute label such as `"Fri, 12 Sep"`.
 *
 * Both arguments are ISO `YYYY-MM-DD` strings and the reference date is passed
 * in by the caller, so no clock is read and the result is deterministic. Values
 * that are not ISO dates are formatted as-is instead of throwing.
 */
export function formatDateLabel(
  date: string,
  referenceDate: string,
  locale: string = DEFAULT_LOCALE,
): string {
  const day = toDayNumber(date);
  const referenceDay = toDayNumber(referenceDate);

  if (day === null || referenceDay === null) {
    return absoluteDateLabel(date, referenceDate, locale);
  }

  const daysAgo = referenceDay - day;
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return absoluteDateLabel(date, referenceDate, locale);
}