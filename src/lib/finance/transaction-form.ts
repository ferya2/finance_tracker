import type { Category } from "@/types/category";
import type { NewTransaction, TransactionType } from "@/types/transaction";
import { parseAmount } from "./format";
import { validateTransaction, type TransactionErrors } from "./transaction";

/**
 * What a new-transaction form holds while it is being filled in. Everything is
 * still a raw string — the amount is whatever was typed ("1,234.56") and is
 * only turned into cents by {@link toNewTransaction}.
 */
export interface TransactionFormValues {
  type: TransactionType;
  /** The typed amount, parsed into integer cents on submit. */
  amount: string;
  categoryId: string;
  note: string;
  /** ISO `YYYY-MM-DD` day the transaction happened on. */
  occurredOn: string;
}

/**
 * A blank form dated `referenceDate`: an expense, no amount, no category and no
 * note. The day is passed in rather than read from a clock so the result is
 * deterministic and testable.
 */
export function emptyTransactionForm(
  referenceDate: string,
): TransactionFormValues {
  return {
    type: "expense",
    amount: "",
    categoryId: "",
    note: "",
    occurredOn: referenceDate,
  };
}

/**
 * Turn form values into the shape the database stores: the amount becomes
 * integer cents, a blank note is dropped rather than saved as an empty string,
 * and the category and date are trimmed. An amount that cannot be parsed falls
 * back to `0` so {@link validateTransaction} reports the field as invalid
 * instead of the save silently succeeding with the wrong number.
 */
export function toNewTransaction(
  values: TransactionFormValues,
): NewTransaction {
  const note = values.note.trim();
  const transaction: NewTransaction = {
    amount: parseAmount(values.amount) ?? 0,
    type: values.type,
    categoryId: values.categoryId.trim(),
    occurredOn: values.occurredOn.trim(),
  };

  if (note.length > 0) {
    transaction.note = note;
  }

  return transaction;
}

/**
 * Validate the form with the shared {@link validateTransaction} rules, so the
 * form and the data layer can never disagree about what is a valid
 * transaction.
 */
export function validateTransactionForm(
  values: TransactionFormValues,
): TransactionErrors {
  return validateTransaction(toNewTransaction(values));
}

/**
 * The categories worth offering for a transaction type: the ones whose `kind`
 * matches, keeping their existing order. A user with no categories of that kind
 * yet (or none at all) still gets every category rather than an empty list.
 */
export function categoriesForType(
  categories: readonly Category[],
  type: TransactionType,
): Category[] {
  const matching = categories.filter((category) => category.kind === type);
  return matching.length > 0 ? matching : [...categories];
}