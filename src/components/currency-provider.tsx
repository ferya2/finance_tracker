"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  BASE_CURRENCY,
  formatConvertedAmount,
  type CurrencyCode,
} from "@/lib/finance/currency";
import { DEFAULT_CURRENCY_CODE } from "@/lib/finance/currency-settings";
import { formatCurrency } from "@/lib/finance/format";
import {
  CURRENCY_CHANGE_EVENT,
  loadCurrency,
  saveCurrency,
} from "@/lib/storage/currency-settings";

export interface CurrencyContextValue {
  /** The currency amounts are displayed in. */
  currency: CurrencyCode;
  /** Persist a new display currency. */
  setCurrency: (currency: CurrencyCode) => void;
  /** Convert an amount stored in the base currency and format it. */
  format: (cents: number, locale?: string) => string;
}

function formatInCurrency(
  cents: number,
  currency: CurrencyCode,
  locale?: string,
): string {
  return (
    formatConvertedAmount(cents, BASE_CURRENCY, currency, {
      ...(locale ? { locale } : {}),
    }) ?? formatCurrency(cents, BASE_CURRENCY, locale)
  );
}

const defaultContext: CurrencyContextValue = {
  currency: DEFAULT_CURRENCY_CODE,
  setCurrency: () => {},
  format: (cents, locale) =>
    formatInCurrency(cents, DEFAULT_CURRENCY_CODE, locale),
};

const CurrencyContext = createContext<CurrencyContextValue>(defaultContext);

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CURRENCY_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CURRENCY_CHANGE_EVENT, onStoreChange);
  };
}

function getServerSnapshot(): CurrencyCode {
  return DEFAULT_CURRENCY_CODE;
}

interface CurrencyProviderProps {
  /** The signed-in user whose preference is stored; anonymous when omitted. */
  userId?: string | null;
  children: ReactNode;
}

/**
 * Makes the user's chosen display currency available to the dashboard. Amounts
 * stay stored in the base currency; the provider converts and formats them on
 * the way out, so every page shows the same numbers.
 */
export function CurrencyProvider({ userId, children }: CurrencyProviderProps) {
  const currency = useSyncExternalStore(
    subscribe,
    () => loadCurrency(userId),
    getServerSnapshot,
  );

  const setCurrency = useCallback(
    (next: CurrencyCode) => {
      saveCurrency(userId, next);
    },
    [userId],
  );

  const format = useCallback(
    (cents: number, locale?: string) =>
      formatInCurrency(cents, currency, locale),
    [currency],
  );

  const value = useMemo(
    () => ({ currency, setCurrency, format }),
    [currency, setCurrency, format],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/** The current display currency, or the default outside a provider. */
export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
