import type { NewTransfer, Transfer } from "@/types/transfer";
import { parseAmount } from "./format";

export interface TransferFormValues {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  note: string;
  occurredOn: string;
}

export interface TransferErrors {
  fromAccountId?: string;
  toAccountId?: string;
  amount?: string;
  note?: string;
  occurredOn?: string;
}

export const MAX_TRANSFER_NOTE_LENGTH = 120;

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

export function emptyTransferForm(referenceDate: string): TransferFormValues {
  return {
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    note: "",
    occurredOn: referenceDate,
  };
}

export function toNewTransfer(values: TransferFormValues): NewTransfer {
  const note = values.note.trim();
  const transfer: NewTransfer = {
    fromAccountId: values.fromAccountId.trim(),
    toAccountId: values.toAccountId.trim(),
    amount: parseAmount(values.amount) ?? 0,
    occurredOn: values.occurredOn.trim(),
  };

  if (note.length > 0) {
    transfer.note = note;
  }

  return transfer;
}

export function validateTransferInput(
  input: NewTransfer,
  accountIds?: readonly string[],
): TransferErrors {
  const errors: TransferErrors = {};
  const from = input.fromAccountId.trim();
  const to = input.toAccountId.trim();
  const knownAccounts = accountIds ? new Set(accountIds) : null;

  if (from.length === 0) {
    errors.fromAccountId = "Choose the account to move money from.";
  } else if (knownAccounts && !knownAccounts.has(from)) {
    errors.fromAccountId = "Choose a valid account.";
  }

  if (to.length === 0) {
    errors.toAccountId = "Choose the account to move money to.";
  } else if (knownAccounts && !knownAccounts.has(to)) {
    errors.toAccountId = "Choose a valid account.";
  } else if (from.length > 0 && from === to) {
    errors.toAccountId = "Choose a different account.";
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    errors.amount = "Amount must be a positive whole number of cents.";
  }

  if (typeof input.occurredOn !== "string" || !isRealDate(input.occurredOn)) {
    errors.occurredOn = "Date must be a valid YYYY-MM-DD date.";
  }

  if (
    input.note !== undefined &&
    typeof input.note === "string" &&
    input.note.length > MAX_TRANSFER_NOTE_LENGTH
  ) {
    errors.note = `Note must be at most ${MAX_TRANSFER_NOTE_LENGTH} characters.`;
  }

  return errors;
}

export function validateTransferForm(
  values: TransferFormValues,
  accountIds?: readonly string[],
): TransferErrors {
  return validateTransferInput(toNewTransfer(values), accountIds);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isTransfer(value: unknown): value is Transfer {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || value.id.length === 0) return false;
  if (typeof value.fromAccountId !== "string") return false;
  if (typeof value.toAccountId !== "string") return false;
  if (typeof value.amount !== "number") return false;
  if (typeof value.occurredOn !== "string") return false;
  if (value.note !== undefined && typeof value.note !== "string") return false;

  const input: NewTransfer = {
    fromAccountId: value.fromAccountId,
    toAccountId: value.toAccountId,
    amount: value.amount,
    note: value.note as string | undefined,
    occurredOn: value.occurredOn,
  };

  return Object.keys(validateTransferInput(input)).length === 0;
}

export function sanitizeTransfers(value: unknown): Transfer[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.filter((entry): entry is Transfer => {
    if (!isTransfer(entry) || seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}
