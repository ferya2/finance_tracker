import { describe, expect, it } from "vitest";
import {
  BASE_CURRENCY,
  DEFAULT_EXCHANGE_RATES,
  SUPPORTED_CURRENCIES,
  conversionLabel,
  convertCurrency,
  currencyInfo,
  formatConvertedAmount,
  isSupportedCurrency,
} from "./currency";

describe("supported currencies", () => {
  it("includes the base currency", () => {
    expect(BASE_CURRENCY).toBe("USD");
    expect(SUPPORTED_CURRENCIES.some((c) => c.code === BASE_CURRENCY)).toBe(true);
  });

  it("has unique codes", () => {
    const codes = SUPPORTED_CURRENCIES.map((currency) => currency.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("recognises supported codes", () => {
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("IDR")).toBe(true);
    expect(isSupportedCurrency("XXX")).toBe(false);
    expect(isSupportedCurrency("usd")).toBe(false);
  });

  it("looks up currency details", () => {
    expect(currencyInfo("EUR")).toEqual({
      code: "EUR",
      name: "Euro",
      symbol: "€",
    });
    expect(currencyInfo("nope")).toBeNull();
  });
});

describe("convertCurrency", () => {
  it("leaves an amount unchanged in the same currency", () => {
    expect(convertCurrency(12345, "USD", "USD")).toBe(12345);
    expect(convertCurrency(12345, "EUR", "EUR")).toBe(12345);
  });

  it("converts from the base currency using the rate", () => {
    expect(convertCurrency(10000, "USD", "EUR")).toBe(9200);
    expect(convertCurrency(10000, "USD", "GBP")).toBe(7900);
    expect(convertCurrency(10000, "USD", "JPY")).toBe(1470000);
  });

  it("converts back to the base currency", () => {
    expect(convertCurrency(9200, "EUR", "USD")).toBe(10000);
  });

  it("converts between two non-base currencies", () => {
    expect(convertCurrency(10000, "EUR", "GBP")).toBe(8587);
  });

  it("rounds to whole cents", () => {
    expect(convertCurrency(1, "USD", "EUR")).toBe(1);
    expect(convertCurrency(1, "EUR", "USD")).toBe(1);
  });

  it("keeps negative amounts negative", () => {
    expect(convertCurrency(-10000, "USD", "EUR")).toBe(-9200);
  });

  it("converts zero to zero", () => {
    expect(convertCurrency(0, "USD", "JPY")).toBe(0);
  });

  it("honours custom rates", () => {
    const rates = { USD: 1, EUR: 2, GBP: 0.5 };
    expect(convertCurrency(10000, "EUR", "GBP", rates)).toBe(2500);
    expect(convertCurrency(10000, "GBP", "EUR", rates)).toBe(40000);
  });

  it("rejects an amount that is not finite", () => {
    expect(convertCurrency(Number.NaN, "USD", "EUR")).toBeNull();
    expect(convertCurrency(Number.POSITIVE_INFINITY, "USD", "EUR")).toBeNull();
  });

  it("rejects unsupported currencies", () => {
    expect(convertCurrency(10000, "XXX", "USD")).toBeNull();
    expect(convertCurrency(10000, "USD", "XXX")).toBeNull();
  });

  it("rejects a missing or invalid rate", () => {
    expect(convertCurrency(10000, "USD", "EUR", { USD: 1 })).toBeNull();
    expect(convertCurrency(10000, "USD", "EUR", { USD: 1, EUR: 0 })).toBeNull();
    expect(
      convertCurrency(10000, "USD", "EUR", {
        USD: 1,
        EUR: Number.NaN,
      }),
    ).toBeNull();
    expect(
      convertCurrency(10000, "USD", "EUR", {
        USD: 1,
        EUR: -0.92,
      }),
    ).toBeNull();
  });
});

describe("formatConvertedAmount", () => {
  it("formats the converted amount in the target currency", () => {
    expect(formatConvertedAmount(10000, "USD", "EUR")).toBe("€92.00");
    expect(formatConvertedAmount(10000, "USD", "GBP")).toBe("£79.00");
  });

  it("formats zero-decimal currencies without fractions", () => {
    expect(formatConvertedAmount(10000, "USD", "JPY")).toBe("¥14,700");
  });

  it("formats an unchanged amount in the same currency", () => {
    expect(formatConvertedAmount(1234, "USD", "USD")).toBe("$12.34");
  });

  it("supports a custom locale and rates", () => {
    const rates = { USD: 1, EUR: 1 };
    expect(
      formatConvertedAmount(1234, "USD", "EUR", { rates, locale: "en-GB" }),
    ).toBe("€12.34");
  });

  it("returns null when conversion fails", () => {
    expect(formatConvertedAmount(10000, "USD", "XXX")).toBeNull();
    expect(formatConvertedAmount(Number.NaN, "USD", "EUR")).toBeNull();
  });
});

describe("conversionLabel", () => {
  it("shows the source and converted amounts", () => {
    expect(conversionLabel(10000, "USD", "EUR")).toBe("$100.00 ≈ €92.00");
  });

  it("shows only the amount when the currencies match", () => {
    expect(conversionLabel(10000, "USD", "USD")).toBe("$100.00");
  });

  it("returns null when conversion fails", () => {
    expect(conversionLabel(10000, "USD", "XXX")).toBeNull();
  });

  it("uses the default rates when none are passed", () => {
    expect(DEFAULT_EXCHANGE_RATES.USD).toBe(1);
    expect(conversionLabel(10000, "EUR", "USD")).toBe("€100.00 ≈ $108.70");
  });
});
