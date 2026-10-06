import type { Category } from "@/types/category";
import type { Transaction, TransactionType } from "@/types/transaction";
import { formatDateLabel } from "./format";

/** Shown when a transaction has no note of its own. */
const FALLBACK_NOTE = "No note";

/** Shown when a category id has no matching category row. */
const FALLBACK_CATEGORY = { name: "Uncategorized", color: "#94a3b8" } as const;

/** A transaction resolved against the user's categories, ready to render. */
export interface TransactionListRow {
  id: string;
  /** The transaction note, or a placeholder when it has none. */
  note: string;
  /** The amount, in cents. */
  amount: number;
  type: TransactionType;
  /** The category this row belongs to, kept as an id so it can be filtered. */
  categoryId: string;
  occurredOn: string;
  /** The day it happened on, relative to the reference day, e.g. "Yesterday". */
  dateLabel: string;
  categoryName: string;
  categoryColor: string;
}

/** The full transactions list, derived from one fetch of user data. */
export interface TransactionListData {
  /** Every transaction, newest first — the list is never capped. */
  rows: TransactionListRow[];
  /** How many transactions the user has in total. */
  total: number;
}

/**
 * Derive the transactions list view model from the user's transactions and
 * categories: every transaction is kept, resolved against its category
 * (falling back to a placeholder when the row is missing) and ordered newest
 * first, with each date labelled relative to `referenceDate`. No clock is read
 * — the reference day is passed in — so the whole function is pure and
 * unit-testable.
 */
export function buildTransactionList(
  transactions: readonly Transaction[],
  categories: readonly Category[],
  referenceDate: string,
): TransactionListData {
  const lookup = new Map(categories.map((category) => [category.id, category]));

  const rows = [...transactions]
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
    .map((transaction) => {
      const category = lookup.get(transaction.categoryId);
      return {
        id: transaction.id,
        note: transaction.note?.trim() || FALLBACK_NOTE,
        amount: transaction.amount,
        type: transaction.type,
        categoryId: transaction.categoryId,
        occurredOn: transaction.occurredOn,
        dateLabel: formatDateLabel(transaction.occurredOn, referenceDate),
        categoryName: category?.name ?? FALLBACK_CATEGORY.name,
        categoryColor: category?.color ?? FALLBACK_CATEGORY.color,
      };
    });

  return { rows, total: transactions.length };
}
