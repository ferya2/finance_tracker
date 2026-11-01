import { sanitizeRecurringTransactions } from "@/lib/finance/recurring-form";
import type { RecurringTransaction } from "@/types/recurring";

export const RECURRING_STORAGE_PREFIX = "finance-tracker:recurring";

/** Fired in this tab whenever the stored recurring plans change. */
export const RECURRING_CHANGE_EVENT = "finance-tracker:recurring-change";

/** The small slice of `Storage` this module needs, so tests can pass a fake. */
export interface RecurringStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): RecurringStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The local-storage key that keeps one user's recurring plans separate. */
export function recurringStorageKey(userId?: string | null): string {
  const id = typeof userId === "string" ? userId.trim() : "";
  return `${RECURRING_STORAGE_PREFIX}:${id.length > 0 ? id : "anonymous"}`;
}

/**
 * Parse a raw local-storage payload into valid recurring entries. A corrupt or
 * outdated payload is treated as empty instead of crashing the page.
 */
export function parseRecurringEntries(
  raw: string | null | undefined,
): RecurringTransaction[] {
  if (!raw) return [];

  try {
    return sanitizeRecurringTransactions(JSON.parse(raw));
  } catch {
    return [];
  }
}

/**
 * Read a user's recurring entries from local storage. Until the app has a
 * recurring table this is the interim home for the UI's data.
 */
export function loadRecurringEntries(
  userId?: string | null,
  storage: RecurringStorage | null = browserStorage(),
): RecurringTransaction[] {
  if (!storage) return [];

  try {
    return parseRecurringEntries(storage.getItem(recurringStorageKey(userId)));
  } catch {
    return [];
  }
}

/** Replace a user's locally stored recurring entries. */
export function saveRecurringEntries(
  userId: string | null | undefined,
  entries: readonly RecurringTransaction[],
  storage: RecurringStorage | null = browserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(recurringStorageKey(userId), JSON.stringify(entries));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(RECURRING_CHANGE_EVENT));
    }
  } catch {
    // A full or blocked storage should not break the page; the UI stays usable.
  }
}
