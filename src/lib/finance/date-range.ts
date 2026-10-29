import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { sumByCategory } from "./by-category";
import { balance, sumExpense, sumIncome } from "./totals";
import { buildSpendingTrend, type TrendPoint } from "./trend";

const DEFAULT_LOCALE = "en-US";
const MS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Shown when a category id has no matching category row. */
const FALLBACK_CATEGORY = { name: "Uncategorized", color: "#94a3b8" } as const;

/** An inclusive span of calendar days, as ISO `YYYY-MM-DD` strings. */
export interface DateRange {
  /** First day of the range (inclusive). */
  start: string;
  /** Last day of the range (inclusive). */
  end: string;
}

/** How finely a range report's trend line is broken down. */
export type RangeGranularity = "day" | "week" | "month";

/** One category's spending in a range report, ready to render. */
export interface DateRangeCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  /** Total spent in the category during the range, in integer cents. */
  amount: number;
  /** Share of the range's expenses, 0-100 (rounded). */
  sharePercent: number;
}

/** The raw rows a date-range report is built from. */
export interface DateRangeReportSource {
  transactions: readonly Transaction[];
  categories: readonly Category[];
}

/** Everything a custom date range's report renders. */
export interface DateRangeReport {
  range: DateRange;
  /** The range as a human label, e.g. "Sep 1 – Sep 15, 2026". */
  label: string;
  /** Income, expense and net across the range, in integer cents. */
  summary: { income: number; expense: number; balance: number };
  /** Range spending per category, biggest first. */
  categories: DateRangeCategory[];
  /** The range's spending bucketed for the trend line. */
  trend: TrendPoint[];
  /** How the trend is bucketed. */
  granularity: RangeGranularity;
  /** How many transactions were recorded during the range. */
  transactionCount: number;
  /** Number of calendar days the range covers (inclusive). */
  days: number;
  /** Average spend per calendar day of the range, in integer cents. */
  dailyAverageExpense: number;
  /** The biggest spending category, or `null` when nothing was spent. */
  topCategory: DateRangeCategory | null;
}

/** Whole days since the epoch for an ISO date, or `null` when it isn't one. */
function toDayNumber(value: string): number | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time)) return null;
  return time / MS_PER_DAY;
}

/** The ISO `YYYY-MM-DD` string for a day number. */
function fromDayNumber(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * True when `value` is a real calendar date in the ISO `YYYY-MM-DD` format, e.g.
 * `"2026-09-15"`. Impossible dates such as `"2026-02-30"` are rejected.
 */
export function isIsoDate(value: string): boolean {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/**
 * True when both ends are real ISO dates and the start is on or before the end.
 * The range is inclusive, so a single day is a valid range.
 */
export function isValidDateRange(range: DateRange): boolean {
  return (
    isIsoDate(range.start) &&
    isIsoDate(range.end) &&
    range.start <= range.end
  );
}

/**
 * Number of calendar days a range covers, inclusive. Returns `0` for an invalid
 * or inverted range, so callers can treat it as "nothing to report".
 */
export function rangeDays(range: DateRange): number {
  if (!isValidDateRange(range)) return 0;
  const start = toDayNumber(range.start);
  const end = toDayNumber(range.end);
  if (start === null || end === null) return 0;
  return end - start + 1;
}

/**
 * A range ending on `end` that covers the last `days` calendar days, inclusive.
 * An invalid end date or a day count below one falls back to a single-day range
 * on `end`, so the result is always usable. The end date is passed in, so no
 * clock is read and the function stays pure.
 */
export function lastNDaysRange(end: string, days: number): DateRange {
  const endDay = toDayNumber(end);
  if (endDay === null || !Number.isFinite(days) || days < 1) {
    return { start: end, end };
  }
  return {
    start: fromDayNumber(endDay - (Math.floor(days) - 1)),
    end,
  };
}

/**
 * Keep only the transactions that fall inside the inclusive range, in the order
 * they were given. Rows with an unusable date are dropped, and an invalid range
 * keeps nothing. The input is never mutated.
 */
export function filterByDateRange(
  transactions: readonly Transaction[],
  range: DateRange,
): Transaction[] {
  if (!isValidDateRange(range)) return [];
  return transactions.filter(
    (transaction) =>
      isIsoDate(transaction.occurredOn) &&
      transaction.occurredOn >= range.start &&
      transaction.occurredOn <= range.end,
  );
}

/**
 * How a range should be bucketed for its trend line: short ranges by day, up to
 * roughly a year by week, and anything longer by month. Keeps the line readable
 * without rendering hundreds of points for a multi-year range.
 */
export function rangeGranularity(range: DateRange): RangeGranularity {
  const days = rangeDays(range);
  if (days <= 62) return "day";
  if (days <= 400) return "week";
  return "month";
}

/** A day and month label such as "Sep 1", pinned to UTC. */
function formatDayMonth(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** A day, month and year label such as "Sep 1, 2026", pinned to UTC. */
function formatDayMonthYear(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/**
 * A human label for an inclusive date range. A single day is shown once, a
 * range inside one year shares the year at the end, and a range that crosses a
 * year boundary spells both years out. Invalid ranges fall back to the raw
 * `start – end` values. Formatting is pinned to UTC and no clock is read.
 */
export function formatDateRangeLabel(
  range: DateRange,
  locale: string = DEFAULT_LOCALE,
): string {
  if (!isValidDateRange(range)) return `${range.start} – ${range.end}`;
  if (range.start === range.end) {
    return formatDayMonthYear(range.start, locale);
  }
  if (range.start.slice(0, 4) === range.end.slice(0, 4)) {
    return `${formatDayMonth(range.start, locale)} – ${formatDayMonthYear(
      range.end,
      locale,
    )}`;
  }
  return `${formatDayMonthYear(range.start, locale)} – ${formatDayMonthYear(
    range.end,
    locale,
  )}`;
}

/** A share of `total` as a rounded 0-100 percentage. */
function sharePercent(amount: number, total: number): number {
  return total > 0 ? Math.round((amount / total) * 100) : 0;
}

/**
 * Build the composed report for a custom date range: headline income, expenses
 * and net, spending per category, a trend over the range, and daily averages.
 * Money stays in integer cents, the range is passed in, and no clock is read,
 * so the result is a pure function of its arguments.
 */
export function buildDateRangeReport(
  source: DateRangeReportSource,
  range: DateRange,
): DateRangeReport {
  const inRange = filterByDateRange(source.transactions, range);
  const income = sumIncome(inRange);
  const expense = sumExpense(inRange);
  const days = rangeDays(range);

  const lookup = new Map(
    source.categories.map((category) => [category.id, category]),
  );
  const categories = sumByCategory(inRange, "expense").map(
    ({ categoryId, total }) => {
      const category = lookup.get(categoryId);
      return {
        categoryId,
        categoryName: category?.name ?? FALLBACK_CATEGORY.name,
        categoryColor: category?.color ?? FALLBACK_CATEGORY.color,
        amount: total,
        sharePercent: sharePercent(total, expense),
      };
    },
  );

  const granularity = rangeGranularity(range);
  const trend = buildSpendingTrend(source.transactions, {
    granularity,
    start: range.start,
    end: range.end,
  });

  return {
    range,
    label: formatDateRangeLabel(range),
    summary: { income, expense, balance: balance(inRange) },
    categories,
    trend,
    granularity,
    transactionCount: inRange.length,
    days,
    dailyAverageExpense: days > 0 ? Math.round(expense / days) : 0,
    topCategory: categories[0] ?? null,
  };
}
