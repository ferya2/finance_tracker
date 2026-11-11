import type { CurrencyCode } from "@/lib/finance/currency";
import {
  parseCurrencySetting,
  sanitizeCurrencyCode,
} from "@/lib/finance/currency-settings";

export const CURRENCY_STORAGE_PREFIX = "finance-tracker:currency";

export const CURRENCY_CHANGE_EVENT = "finance-tracker:currency-change";

export interface CurrencyStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): CurrencyStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function currencyStorageKey(userId?: string | null): string {
  const id = typeof userId === "string" ? userId.trim() : "";
  return `${CURRENCY_STORAGE_PREFIX}:${id.length > 0 ? id : "anonymous"}`;
}

export function loadCurrency(
  userId?: string | null,
  storage: CurrencyStorage | null = browserStorage(),
): CurrencyCode {
  if (!storage) return parseCurrencySetting(null);

  try {
    return parseCurrencySetting(storage.getItem(currencyStorageKey(userId)));
  } catch {
    return parseCurrencySetting(null);
  }
}

export function saveCurrency(
  userId: string | null | undefined,
  currency: CurrencyCode,
  storage: CurrencyStorage | null = browserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(
      currencyStorageKey(userId),
      sanitizeCurrencyCode(currency),
    );
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CURRENCY_CHANGE_EVENT));
    }
  } catch {
    return;
  }
}
