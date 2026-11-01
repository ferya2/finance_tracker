import type { Category } from "@/types/category";
import type {
  NewRecurringTransaction,
  RecurrenceFrequency,
  RecurringTransaction,
} from "@/types/recurring";
import type { TransactionType } from "@/types/transaction";
import { formatAmountInput, parseAmount } from "./format";
import { nextOccurrence } from "./recurring";
import { validateTransaction } from "./transaction";

/** The fields a recurring-transaction form holds while it is being filled in. */
export interface RecurringFormValues {
  type: TransactionType;
  /** The typed amount, parsed into integer cents on submit. */
  amount: string;
  categoryId: string;
  note: string;
  /** ISO `YYYY-MM-DD` day the first occurrence lands on. */
  startOn: string;
  frequency: RecurrenceFrequency;
  /** The typed repeat interval, parsed into a whole number on submit. */
  interval: string;
  /** Optional ISO `YYYY-MM-DD` last occurrence. */
  endOn: string;
}

export interface RecurringErrors {
  amount?: string;
  type?: string;
  categoryId?: string;
  note?: string;
  startOn?: string;
  frequency?: string;
  interval?: string;
  endOn?: string;
}

export const FREQUENCY_OPTIONS: ReadonlyArray<{
  value: RecurrenceFrequency;
  label: string;
}> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const FREQUENCIES = new Set<string>(
  FREQUENCY_OPTIONS.map((option) => option.value),
);

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

/** A blank recurring form starting on `referenceDate`, repeating monthly. */
export function emptyRecurringForm(
  referenceDate: string,
): RecurringFormValues {
  return {
    type: "expense",
    amount: "",
    categoryId: "",
    note: "",
    startOn: referenceDate,
    frequency: "monthly",
    interval: "1",
    endOn: "",
  };
}

/** Prefill an edit form from a recurring transaction that is already saved. */
export function recurringToFormValues(
  recurring: RecurringTransaction,
): RecurringFormValues {
  return {
    type: recurring.type,
    amount: formatAmountInput(recurring.amount),
    categoryId: recurring.categoryId,
    note: recurring.note ?? "",
    startOn: recurring.startOn,
    frequency: recurring.frequency,
    interval: String(recurring.interval),
    endOn: recurring.endOn ?? "",
  };
}

/**
 * Turn form values into the shape stored for a recurring transaction. The
 * amount and interval become numbers, text is trimmed, and an empty note or end
 * date is dropped rather than saved as an empty string.
 */
export function toNewRecurring(
  values: RecurringFormValues,
): NewRecurringTransaction {
  const note = values.note.trim();
  const endOn = values.endOn.trim();
  const interval =
    values.interval.trim() === "" ? 0 : Number(values.interval.trim());

  const recurring: NewRecurringTransaction = {
    amount: parseAmount(values.amount) ?? 0,
    type: values.type,
    categoryId: values.categoryId.trim(),
    startOn: values.startOn.trim(),
    frequency: values.frequency,
    interval,
  };

  if (note.length > 0) {
    recurring.note = note;
  }

  if (endOn.length > 0) {
    recurring.endOn = endOn;
  }

  return recurring;
}

/**
 * Validate a recurring transaction before it is saved. The amount, type,
 * category, note and start date reuse the transaction rules; the frequency must
 * be known, the interval a whole number of at least one, and an optional end
 * date must be real and not before the start.
 */
export function validateRecurringInput(
  input: NewRecurringTransaction,
): RecurringErrors {
  const errors: RecurringErrors = {};
  const base = validateTransaction({
    amount: input.amount,
    type: input.type,
    categoryId: input.categoryId,
    note: input.note,
    occurredOn: input.startOn,
  });

  if (base.amount) errors.amount = base.amount;
  if (base.type) errors.type = base.type;
  if (base.categoryId) errors.categoryId = base.categoryId;
  if (base.note) errors.note = base.note;
  if (base.occurredOn) {
    errors.startOn = "Start date must be a valid YYYY-MM-DD date.";
  }

  if (!FREQUENCIES.has(input.frequency)) {
    errors.frequency = "Frequency must be daily, weekly, monthly or yearly.";
  }

  if (!Number.isInteger(input.interval) || input.interval < 1) {
    errors.interval = "Interval must be a whole number of at least 1.";
  }

  if (input.endOn !== undefined && input.endOn !== null && input.endOn !== "") {
    if (typeof input.endOn !== "string" || !isRealDate(input.endOn)) {
      errors.endOn = "End date must be a valid YYYY-MM-DD date.";
    } else if (!errors.startOn && input.endOn < input.startOn) {
      errors.endOn = "End date cannot be before the start date.";
    }
  }

  return errors;
}

/** Validate a recurring form with the shared {@link validateRecurringInput} rules. */
export function validateRecurringForm(
  values: RecurringFormValues,
): RecurringErrors {
  return validateRecurringInput(toNewRecurring(values));
}

/** A human label for a schedule, e.g. `"Every 2 weeks"` or `"Every month"`. */
export function describeFrequency(
  frequency: RecurrenceFrequency,
  interval: number,
): string {
  if (!FREQUENCIES.has(frequency)) return "Custom schedule";

  const step =
    Number.isFinite(interval) && interval >= 1 ? Math.floor(interval) : 1;
  const unit =
    frequency === "daily"
      ? "day"
      : frequency === "weekly"
        ? "week"
        : frequency === "monthly"
          ? "month"
          : "year";

  return step === 1 ? `Every ${unit}` : `Every ${step} ${unit}s`;
}

/** One recurring transaction resolved against the user's categories. */
export interface RecurringListItem {
  id: string;
  amount: number;
  type: TransactionType;
  note: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  scheduleLabel: string;
  /** The next occurrence strictly after the reference day, or `null` when ended. */
  nextOn: string | null;
  ended: boolean;
}

/**
 * Resolve recurring entries against the user's categories and order them by
 * their next occurrence, soonest first. Entries whose schedule has ended fall to
 * the bottom. The reference day is passed in, so this stays pure.
 */
export function buildRecurringList(
  entries: readonly RecurringTransaction[],
  categories: readonly Category[],
  after: string,
): RecurringListItem[] {
  const byId = new Map(categories.map((category) => [category.id, category]));

  const rows = entries.map((entry): RecurringListItem => {
    const category = byId.get(entry.categoryId);
    const nextOn = nextOccurrence(entry, after);

    return {
      id: entry.id,
      amount: entry.amount,
      type: entry.type,
      note: entry.note?.trim() || "Recurring transaction",
      categoryId: entry.categoryId,
      categoryName: category?.name ?? "Uncategorized",
      categoryColor: category?.color ?? "#71717a",
      scheduleLabel: describeFrequency(entry.frequency, entry.interval),
      nextOn,
      ended: nextOn === null,
    };
  });

  return rows.sort((a, b) => {
    if (a.nextOn === null && b.nextOn === null) {
      return a.note.localeCompare(b.note);
    }
    if (a.nextOn === null) return 1;
    if (b.nextOn === null) return -1;
    return a.nextOn.localeCompare(b.nextOn);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * True when `value` is a complete recurring transaction with valid fields. Used
 * to keep a corrupt or outdated local-storage payload from reaching the UI.
 */
export function isRecurringTransaction(
  value: unknown,
): value is RecurringTransaction {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || value.id.length === 0) return false;
  if (value.note !== undefined && typeof value.note !== "string") return false;
  if (
    value.endOn !== undefined &&
    value.endOn !== null &&
    typeof value.endOn !== "string"
  ) {
    return false;
  }

  const input: NewRecurringTransaction = {
    amount: value.amount as number,
    type: value.type as TransactionType,
    categoryId: value.categoryId as string,
    note: value.note as string | undefined,
    startOn: value.startOn as string,
    frequency: value.frequency as RecurrenceFrequency,
    interval: value.interval as number,
    endOn: value.endOn as string | null | undefined,
  };

  return Object.keys(validateRecurringInput(input)).length === 0;
}

/**
 * Keep only valid, uniquely identified recurring transactions from an unknown
 * stored value (for example the parsed contents of local storage).
 */
export function sanitizeRecurringTransactions(
  value: unknown,
): RecurringTransaction[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.filter((entry): entry is RecurringTransaction => {
    if (!isRecurringTransaction(entry) || seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}
