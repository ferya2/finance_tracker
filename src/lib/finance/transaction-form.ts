import type { Category } from "@/types/category";
import type { NewTransaction, Transaction, TransactionType } from "@/types/transaction";
import { formatAmountInput, parseAmount } from "./format";
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
 * The fields an edit writes over an existing transaction. Every editable field
 * is present, including the note.
 */
export type TransactionEdit = NewTransaction & { note: string };

/**
 * Prefill an edit form from a transaction that is already saved: cents become a
 * plain decimal amount and a transaction with no note starts with an empty
 * note, so the field is never pre-filled with a placeholder.
 *
 * If the saved category is no longer on offer for the transaction's type — it
 * was deleted, or its kind changed — the category is left empty rather than
 * holding an id that is not on screen, which would save a category the user
 * never picked.
 */
export function transactionToFormValues(
  transaction: Transaction,
  categories: readonly Category[],
): TransactionFormValues {
  const values: TransactionFormValues = {
    type: transaction.type,
    amount: formatAmountInput(transaction.amount),
    categoryId: transaction.categoryId,
    note: transaction.note ?? "",
    occurredOn: transaction.occurredOn,
  };

  const stillOffered = categoriesForType(categories, values.type).some(
    (category) => category.id === values.categoryId,
  );

  return stillOffered ? values : { ...values, categoryId: "" };
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
 * Turn form values into the fields to write over a saved transaction. Parsing
 * matches {@link toNewTransaction}, except that emptying the note is itself a
 * change: the note is always sent, so clearing the field clears the saved row
 * instead of leaving the old one in place.
 */
export function toTransactionUpdate(values: TransactionFormValues): TransactionEdit {
  return {
    ...toNewTransaction(values),
    note: values.note.trim(),
  };
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