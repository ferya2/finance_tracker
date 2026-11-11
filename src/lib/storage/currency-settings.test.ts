import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CURRENCY_CHANGE_EVENT,
  CURRENCY_STORAGE_PREFIX,
  currencyStorageKey,
  loadCurrency,
  saveCurrency,
  type CurrencyStorage,
} from "./currency-settings";
import { DEFAULT_CURRENCY_CODE } from "@/lib/finance/currency-settings";

function memoryStorage(initial: Record<string, string> = {}): CurrencyStorage & {
  values: Record<string, string>;
} {
  const values = { ...initial };
  return {
    values,
    getItem: (key) => (key in values ? values[key] : null),
    setItem: (key, value) => {
      values[key] = value;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("currencyStorageKey", () => {
  it("scopes the key to the user", () => {
    expect(currencyStorageKey("user-1")).toBe(
      `${CURRENCY_STORAGE_PREFIX}:user-1`,
    );
  });

  it("uses an anonymous key when there is no user", () => {
    expect(currencyStorageKey(null)).toBe(
      `${CURRENCY_STORAGE_PREFIX}:anonymous`,
    );
    expect(currencyStorageKey("  ")).toBe(
      `${CURRENCY_STORAGE_PREFIX}:anonymous`,
    );
  });
});

describe("loadCurrency", () => {
  it("reads a saved currency for the user", () => {
    const storage = memoryStorage({
      [currencyStorageKey("user-1")]: "EUR",
    });
    expect(loadCurrency("user-1", storage)).toBe("EUR");
  });

  it("falls back when nothing is saved", () => {
    expect(loadCurrency("user-1", memoryStorage())).toBe(
      DEFAULT_CURRENCY_CODE,
    );
  });

  it("falls back when storage is unavailable", () => {
    expect(loadCurrency("user-1", null)).toBe(DEFAULT_CURRENCY_CODE);
  });

  it("falls back when storage throws", () => {
    const storage: CurrencyStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: vi.fn(),
    };
    expect(loadCurrency("user-1", storage)).toBe(DEFAULT_CURRENCY_CODE);
  });
});

describe("saveCurrency", () => {
  it("saves the currency under the user's key", () => {
    const storage = memoryStorage();
    saveCurrency("user-1", "GBP", storage);
    expect(storage.values[currencyStorageKey("user-1")]).toBe("GBP");
  });

  it("dispatches a change event", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });

    const storage = memoryStorage();
    saveCurrency("user-1", "JPY", storage);

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: CURRENCY_CHANGE_EVENT }),
    );
  });

  it("does nothing without storage", () => {
    expect(() => saveCurrency("user-1", "EUR", null)).not.toThrow();
  });
});
