import type { TransactionListRow } from "./transaction-list";

/**
 * The query as it is actually compared: surrounding whitespace trimmed and
 * lower-cased, so `"  Rent "` and `"rent"` are the same search.
 */
export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * True when the row's note or its category name contains the query. Matching
 * is case-insensitive and a blank query accepts every row, so search is a
 * pure function of its arguments — no clock, no I/O, no mutation.
 */
export function matchesTransactionQuery(
  row: TransactionListRow,
  query: string,
): boolean {
  const q = normalizeSearchQuery(query);
  if (!q) return true;
  return (
    row.note.toLowerCase().includes(q) ||
    row.categoryName.toLowerCase().includes(q)
  );
}

/**
 * Keep only the rows the free-text query matches, in the order they were
 * given. Chain it after `filterTransactions` to narrow the same list by
 * criteria and text at once.
 */
export function searchTransactions(
  rows: readonly TransactionListRow[],
  query: string,
): TransactionListRow[] {
  return rows.filter((row) => matchesTransactionQuery(row, query));
}
