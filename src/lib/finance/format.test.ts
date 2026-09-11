import { describe, expect, it } from "vitest";
import { formatCurrency, parseAmount } from "./format";

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