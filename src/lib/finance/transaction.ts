import type { NewTransaction } from "@/types/transaction";

export interface TransactionErrors {
  amount?: string;
  type?: string;
  categoryId?: string;
  note?: string;
  occurredOn?: string;
}

export const MAX_NOTE_LENGTH = 200;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validate a new transaction before it is saved. Amounts are integer cents,
 * `type` must be income or expense, a category is required, the date must be a
 * real calendar date (`YYYY-MM-DD`), and the optional note has a size limit.
 * Returns an object of per-field error messages (empty when valid).
 */
export function validateTransaction(input: NewTransaction): TransactionErrors {
  const errors: TransactionErrors = {};

  const { amount, type, categoryId, note, occurredOn } = input;

  if (!Number.isInteger(amount) || amount <= 0) {
    errors.amount = "Amount must be a positive whole number of cents.";
  }

  if (type !== "income" && type !== "expense") {
    errors.type = 'Type must be "income" or "expense".';
  }

  if (typeof categoryId !== "string" || categoryId.trim().length === 0) {
    errors.categoryId = "Category is required.";
  }

  if (note !== undefined) {
    if (typeof note !== "string") {
      errors.note = "Note must be a string.";
    } else if (note.length > MAX_NOTE_LENGTH) {
      errors.note = `Note must be at most ${MAX_NOTE_LENGTH} characters.`;
    }
  }

  if (typeof occurredOn !== "string" || !isRealDate(occurredOn)) {
    errors.occurredOn = "Occurred on must be a valid YYYY-MM-DD date.";
  }

  return errors;
}

export function isValidTransaction(input: NewTransaction): boolean {
  return Object.keys(validateTransaction(input)).length === 0;
}