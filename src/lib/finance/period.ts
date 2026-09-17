/** Inclusive calendar bounds of one month as `YYYY-MM-DD` strings. */
export interface MonthRange {
  /** First day of the month, always day 01. */
  start: string;
  /** Last day of the month (28-31 days, leap-year aware). */
  end: string;
}

/** The calendar year and (1-based) month a date falls in. */
export interface YearMonth {
  year: number;
  month: number;
}

/**
 * Number of days in a calendar month (1-12), leap-year aware. `month` is 1-12;
 * e.g. February 2024 (a leap year) yields `29`.
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The inclusive calendar bounds of one month as `YYYY-MM-DD` strings, e.g.
 * September 2026 yields `{ start: "2026-09-01", end: "2026-09-30" }`. `month`
 * is 1-12.
 */
export function monthRange(year: number, month: number): MonthRange {
  return {
    start: `${year}-${String(month).padStart(2, "0")}-01`,
    end: `${year}-${String(month).padStart(2, "0")}-${String(
      daysInMonth(year, month),
    ).padStart(2, "0")}`,
  };
}

/**
 * The year and (1-based) month a date falls in, e.g. 2026-09-15 →
 * `{ year: 2026, month: 9 }`. The date is passed in as an argument so this
 * function stays pure (no implicit clock).
 */
export function currentPeriod(date: Date): YearMonth {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}