import { describe, expect, it } from "vitest";
import {
  DEFAULT_CURRENCY_CODE,
  parseCurrencySetting,
  sanitizeCurrencyCode,
} from "./currency-settings";

describe("sanitizeCurrencyCode", () => {
  it("keeps a supported code", () => {
    expect(sanitizeCurrencyCode("EUR")).toBe("EUR");
    expect(sanitizeCurrencyCode("IDR")).toBe("IDR");
  });

  it("falls back for unsupported or malformed values", () => {
    expect(sanitizeCurrencyCode("XXX")).toBe(DEFAULT_CURRENCY_CODE);
    expect(sanitizeCurrencyCode("eur")).toBe(DEFAULT_CURRENCY_CODE);
    expect(sanitizeCurrencyCode("")).toBe(DEFAULT_CURRENCY_CODE);
  });

  it("falls back for non-string values", () => {
    expect(sanitizeCurrencyCode(null)).toBe(DEFAULT_CURRENCY_CODE);
    expect(sanitizeCurrencyCode(undefined)).toBe(DEFAULT_CURRENCY_CODE);
    expect(sanitizeCurrencyCode(42)).toBe(DEFAULT_CURRENCY_CODE);
  });
});

describe("parseCurrencySetting", () => {
  it("reads a valid stored code", () => {
    expect(parseCurrencySetting("GBP")).toBe("GBP");
  });

  it("trims surrounding whitespace", () => {
    expect(parseCurrencySetting("  JPY  ")).toBe("JPY");
  });

  it("falls back for empty or invalid storage", () => {
    expect(parseCurrencySetting(null)).toBe(DEFAULT_CURRENCY_CODE);
    expect(parseCurrencySetting(undefined)).toBe(DEFAULT_CURRENCY_CODE);
    expect(parseCurrencySetting("")).toBe(DEFAULT_CURRENCY_CODE);
    expect(parseCurrencySetting("not-a-currency")).toBe(DEFAULT_CURRENCY_CODE);
  });
});
