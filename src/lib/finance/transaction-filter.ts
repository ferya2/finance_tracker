import type { TransactionType } from "@/types/transaction";
import type { TransactionListRow } from "./transaction-list";

/** A type criterion: one kind of transaction, or everything. */
export type TypeFilter = "all" | TransactionType;

/** The `categoryId` value that leaves every category in. */
export const ALL_CATEGORIES = "all";

/** What the transactions list is being filtered by. Criteria combine with AND. */
export interface TransactionFilter {
  type: TypeFilter;
  /** A category id, or {@link ALL_CATEGORIES} to keep every category. */
  categoryId: string;
}

/** No restrictions — every transaction stays visible. */
export const DEFAULT_TRANSACTION_FILTER: TransactionFilter = {
  type: "all",
  categoryId: ALL_CATEGORIES,
};

/**
 * True when the criteria leave the list exactly as it was — nothing is being
 * filtered, so there is nothing to clear.
 */
export function isDefaultFilter(filter: TransactionFilter): boolean {
  return filter.type === "all" && filter.categoryId === ALL_CATEGORIES;
}

/**
 * Keep only the rows every criterion accepts: a type of `"all"` accepts both
 * kinds, an {@link ALL_CATEGORIES} category accepts every category, and
 * otherwise both must match. The input is never mutated and no clock or
 * external state is read, so the result is a pure function of its arguments.
 */
export function filterTransactions(
  rows: readonly TransactionListRow[],
  filter: TransactionFilter,
): TransactionListRow[] {
  return rows.filter(
    (row) =>
      (filter.type === "all" || row.type === filter.type) &&
      (filter.categoryId === ALL_CATEGORIES ||
        row.categoryId === filter.categoryId),
  );
}
