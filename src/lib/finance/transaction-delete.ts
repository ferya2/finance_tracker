import type { NewTransaction, Transaction } from "@/types/transaction";
import { formatCurrency } from "./format";

/** Shown in place of a note when a transaction never had one. */
const FALLBACK_NOTE = "Transaction";

/**
 * How long the undo snackbar stays up after a delete, in milliseconds. Long
 * enough to notice and reach for, short enough that the confirmation does not
 * linger after it has been dealt with.
 */
export const UNDO_WINDOW_MS = 8_000;

/**
 * The fields of a transaction that are kept in memory while it is deleted, so
 * undo can put it back. The database assigns the id on insert, so the snapshot
 * deliberately drops it — undo restores the transaction, not its identity.
 */
export type RestorableTransaction = NewTransaction;

/**
 * Snapshot a saved transaction before it is deleted, so the undo action can
 * write it back exactly as it was.
 */
export function toRestorableTransaction(
  transaction: Transaction,
): RestorableTransaction {
  const restorable: RestorableTransaction = {
    amount: transaction.amount,
    type: transaction.type,
    categoryId: transaction.categoryId,
    occurredOn: transaction.occurredOn,
  };

  if (transaction.note !== undefined) {
    restorable.note = transaction.note;
  }

  return restorable;
}

/**
 * The row shape the insert query accepts for a snapshot, ready to be handed
 * straight to `createTransaction` when the user undoes a delete.
 */
export function restorableToNewTransaction(
  restorable: RestorableTransaction,
): NewTransaction {
  return { ...restorable };
}

/**
 * A short "what is this" label for a transaction — its note (or a neutral
 * word when it has none) and its amount, signed the same way the list shows it,
 * e.g. `"Rent" · −$1,150.00`.
 */
export function describeTransaction(
  restorable: RestorableTransaction,
  currency?: string,
): string {
  const label = restorable.note?.trim() || FALLBACK_NOTE;
  const sign = restorable.type === "income" ? "+" : "−";

  return `"${label}" · ${sign}${formatCurrency(restorable.amount, currency)}`;
}

/**
 * What the undo snackbar says about what was just removed, e.g.
 * `Deleted "Rent" · −$1,150.00`.
 */
export function describeDeletedTransaction(
  restorable: RestorableTransaction,
  currency?: string,
): string {
  return `Deleted ${describeTransaction(restorable, currency)}`;
}
