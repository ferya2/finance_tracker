import type { TransactionListRow } from "./transaction-list";
import { formatMonthLabel } from "./period";

/** The month criterion that leaves every month in. */
export const ALL_MONTHS = "all";

/** A month criterion: a `YYYY-MM` key, or {@link ALL_MONTHS} for everything. */
export type MonthFilter = "all" | string;

/** The `YYYY-MM` key a `YYYY-MM-DD` date falls in, e.g. "2026-09-15" → "2026-09". */
export function monthKeyOf(dateString: string): string {
  return dateString.slice(0, 7);
}

/**
 * True when the row falls in the selected month. An {@link ALL_MONTHS} filter
 * accepts every row; any other value must equal the row's `YYYY-MM` key.
 */
export function matchesMonth(
  row: TransactionListRow,
  filter: MonthFilter,
): boolean {
  return filter === ALL_MONTHS || monthKeyOf(row.occurredOn) === filter;
}

/**
 * Keep only the rows that fall in the selected month, in the order they were
 * given. Chain it beside `filterTransactions` to narrow the same list by
 * calendar month and by type/category at once.
 */
export function filterByMonth(
  rows: readonly TransactionListRow[],
  filter: MonthFilter,
): TransactionListRow[] {
  return rows.filter((row) => matchesMonth(row, filter));
}

/**
 * The distinct calendar months the rows span, newest first — the choices for a
 * month selector. Undated rows and repeated months are each counted once.
 */
export function monthOptions(rows: readonly TransactionListRow[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    seen.add(monthKeyOf(row.occurredOn));
  }
  return [...seen].sort((a, b) => b.localeCompare(a));
}

/**
 * A human label for a `YYYY-MM` key, e.g. "2026-09" → "September 2026". The
 * key is parsed locally and labelled by the pure `formatMonthLabel`, so it
 * reads no clock (dates are passed in to both).
 */
export function formatMonthKeyLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return formatMonthLabel(year, month);
}