import { describe, expect, it } from "vitest";
import {
  formatAmountInput,
  formatCurrency,
  formatDateLabel,
  parseAmount,
} from "./format";

describe("formatCurrency", () => {
  it("formats zero as an integer dollar amount", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats whole dollars", () => {
    expect(formatCurrency(1200)).toBe("$12.00");
  });

  it("formats cents", () => {
    expect(formatCurrency(1234)).toBe("$12.34");
  });

  it("formats a single cent", () => {
    expect(formatCurrency(1)).toBe("$0.01");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-505)).toBe("-$5.05");
  });

  it("adds thousands separators", () => {
    expect(formatCurrency(123456)).toBe("$1,234.56");
  });

  it("supports a custom currency", () => {
    expect(formatCurrency(4200, "EUR")).toBe("€42.00");
  });

  it("supports a custom locale", () => {
    expect(formatCurrency(1234, "USD", "en-GB")).toBe("US$12.34");
  });
});

describe("formatAmountInput", () => {
  it("renders dollars and cents without a currency symbol or separators", () => {
    expect(formatAmountInput(123456)).toBe("1234.56");
  });

  it("drops redundant decimals from a whole amount", () => {
    expect(formatAmountInput(240000)).toBe("2400");
    expect(formatAmountInput(0)).toBe("0");
  });

  it("keeps both digits when only cents are left", () => {
    expect(formatAmountInput(5)).toBe("0.05");
    expect(formatAmountInput(50)).toBe("0.50");
  });

  it("keeps a negative amount negative", () => {
    expect(formatAmountInput(-1234)).toBe("-12.34");
    expect(formatAmountInput(-240000)).toBe("-2400");
  });

  it("rounds a fractional number of cents so the result stays an amount", () => {
    expect(formatAmountInput(12.7)).toBe("0.13");
  });

  it("round-trips back to the same cents through parseAmount", () => {
    for (const cents of [1, 5, 99, 100, 8635, 123456, 240000, -1234]) {
      expect(parseAmount(formatAmountInput(cents))).toBe(cents);
    }
  });
});

describe("parseAmount", () => {
  it("parses dollars and cents", () => {
    expect(parseAmount("12.34")).toBe(1234);
  });

  it("parses whole dollars", () => {
    expect(parseAmount("12")).toBe(1200);
  });

  it("parses a single decimal place", () => {
    expect(parseAmount("12.5")).toBe(1250);
  });

  it("parses zero", () => {
    expect(parseAmount("0")).toBe(0);
  });

  it("parses negative amounts", () => {
    expect(parseAmount("-10.50")).toBe(-1050);
  });

  it("parses a dollar sign prefix", () => {
    expect(parseAmount("$12.34")).toBe(1234);
  });

  it("parses comma thousands separators", () => {
    expect(parseAmount("1,234.56")).toBe(123456);
  });

  it("trims surrounding whitespace", () => {
    expect(parseAmount("  12.34  ")).toBe(1234);
  });

  it("rejects an empty string", () => {
    expect(parseAmount("")).toBeNull();
  });

  it("rejects a whitespace-only string", () => {
    expect(parseAmount("   ")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(parseAmount("abc")).toBeNull();
  });

  it("rejects more than two decimal places", () => {
    expect(parseAmount("12.345")).toBeNull();
  });

  it("rejects a bare decimal point", () => {
    expect(parseAmount("12.")).toBeNull();
  });

  it("rejects a leading decimal point", () => {
    expect(parseAmount(".5")).toBeNull();
  });

  it("rejects a non-string input", () => {
    expect(parseAmount(null as unknown as string)).toBeNull();
  });
});

describe("formatDateLabel", () => {
  const TODAY = "2026-09-15";

  it("labels the reference day as today", () => {
    expect(formatDateLabel(TODAY, TODAY)).toBe("Today");
  });

  it("labels the day before the reference day as yesterday", () => {
    expect(formatDateLabel("2026-09-14", TODAY)).toBe("Yesterday");
  });

  it("labels older days with the weekday and date", () => {
    expect(formatDateLabel("2026-09-11", TODAY)).toBe("Fri, Sep 11");
  });

  it("includes the year when it differs from the reference year", () => {
    expect(formatDateLabel("2025-12-25", TODAY)).toBe("Thu, Dec 25, 2025");
  });

  it("labels a day in the future as an absolute date", () => {
    expect(formatDateLabel("2026-09-20", TODAY)).toBe("Sun, Sep 20");
  });

  it("crosses month and year boundaries", () => {
    expect(formatDateLabel("2026-08-31", "2026-09-01")).toBe("Yesterday");
    expect(formatDateLabel("2025-12-31", "2026-01-01")).toBe("Yesterday");
  });

  it("supports a custom locale", () => {
    expect(formatDateLabel("2026-09-11", TODAY, "en-GB")).toBe("Fri 11 Sept");
  });

  it("returns unparseable dates untouched instead of throwing", () => {
    expect(formatDateLabel("not-a-date", TODAY)).toBe("not-a-date");
    expect(formatDateLabel("2026-13-40", TODAY)).toBe("2026-13-40");
  });

  it("falls back to an absolute label when the reference date is unusable", () => {
    expect(formatDateLabel("2026-09-11", "whenever")).toBe("Fri, Sep 11, 2026");
    expect(formatDateLabel(TODAY, "whenever")).toBe("Tue, Sep 15, 2026");
  });
});