import type { TransactionListRow } from "./transaction-list";

/** The columns of an exported transactions CSV, in order. */
export const CSV_HEADERS = [
  "Date",
  "Type",
  "Category",
  "Note",
  "Amount",
] as const;

const NEEDS_QUOTES = /[",\r\n]/;

/**
 * Escape one CSV field: fields containing a comma, quote or line break are
 * wrapped in double quotes, with any embedded quote doubled. Everything else is
 * returned untouched.
 */
export function escapeCsvField(value: string): string {
  return NEEDS_QUOTES.test(value)
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

/** An integer amount in cents as a plain decimal string, e.g. 1234 → "12.34". */
export function formatCsvAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** One transaction as a CSV line, newest-first order preserved by the caller. */
export function transactionToCsvRow(row: TransactionListRow): string {
  return [
    row.occurredOn,
    row.type,
    row.categoryName,
    row.note,
    formatCsvAmount(row.amount),
  ]
    .map(escapeCsvField)
    .join(",");
}

/**
 * Serialize transactions to CSV text with a header row and CRLF line endings,
 * which spreadsheet apps open cleanly on every platform. The rows are written
 * in the order given and the input is never mutated.
 */
export function transactionsToCsv(rows: readonly TransactionListRow[]): string {
  return [
    CSV_HEADERS.join(","),
    ...rows.map(transactionToCsvRow),
  ].join("\r\n") + "\r\n";
}

/** The download name for an export made on a `YYYY-MM-DD` date. */
export function exportCsvFileName(date: string): string {
  return `transactions-${date}.csv`;
}
