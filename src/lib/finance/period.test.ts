import { describe, expect, it } from "vitest";
import {
  currentPeriod,
  daysInMonth,
  formatMonthLabel,
  formatMonthName,
  monthKey,
  monthRange,
  previousPeriod,
} from "./period";

describe("daysInMonth", () => {
  it("returns 31 for months with 31 days", () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 3)).toBe(31);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it("returns 30 for months with 30 days", () => {
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 9)).toBe(30);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  it("returns 29 for February in a leap year", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2000, 2)).toBe(29);
  });

  it("returns 28 for February outside leap years", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2025, 2)).toBe(28);
    expect(daysInMonth(1900, 2)).toBe(28);
  });
});

describe("monthRange", () => {
  it("returns the first and last calendar day of the month", () => {
    expect(monthRange(2026, 9)).toEqual({
      start: "2026-09-01",
      end: "2026-09-30",
    });
  });

  it("zero-pads single-digit months", () => {
    expect(monthRange(2026, 1)).toEqual({
      start: "2026-01-01",
      end: "2026-01-31",
    });
    expect(monthRange(2026, 2)).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
  });

  it("ends on day 29 for February in a leap year", () => {
    expect(monthRange(2024, 2)).toEqual({
      start: "2024-02-01",
      end: "2024-02-29",
    });
  });

  it("handles a 31-day month ending on day 31", () => {
    expect(monthRange(2026, 12)).toEqual({
      start: "2026-12-01",
      end: "2026-12-31",
    });
  });

  it("distinguishes single-digit months from their double-digit cousins", () => {
    expect(monthRange(2026, 10)).toEqual({
      start: "2026-10-01",
      end: "2026-10-31",
    });
  });
});

describe("currentPeriod", () => {
  it("returns the year and 1-based month of the given date", () => {
    expect(currentPeriod(new Date(2026, 8, 15))).toEqual({ year: 2026, month: 9 });
  });

  it("returns month 1 for a January date", () => {
    expect(currentPeriod(new Date(2026, 0, 1))).toEqual({ year: 2026, month: 1 });
  });

  it("returns month 12 for a December date", () => {
    expect(currentPeriod(new Date(2025, 11, 31))).toEqual({ year: 2025, month: 12 });
  });

  it("respects the year boundary between December and January", () => {
    expect(currentPeriod(new Date(2025, 11, 31))).toEqual({ year: 2025, month: 12 });
    expect(currentPeriod(new Date(2026, 0, 1))).toEqual({ year: 2026, month: 1 });
  });

  it("works for an early-year date in a different year", () => {
    expect(currentPeriod(new Date(2030, 2, 3))).toEqual({ year: 2030, month: 3 });
  });
});

describe("previousPeriod", () => {
  it("steps back one month inside the same year", () => {
    expect(previousPeriod({ year: 2026, month: 9 })).toEqual({
      year: 2026,
      month: 8,
    });
  });

  it("steps back from the second month into the first", () => {
    expect(previousPeriod({ year: 2026, month: 2 })).toEqual({
      year: 2026,
      month: 1,
    });
  });

  it("rolls over to December of the previous year in January", () => {
    expect(previousPeriod({ year: 2026, month: 1 })).toEqual({
      year: 2025,
      month: 12,
    });
  });

  it("does not mutate the period it was given", () => {
    const period = { year: 2026, month: 1 };
    previousPeriod(period);
    expect(period).toEqual({ year: 2026, month: 1 });
  });
});

describe("monthKey", () => {
  it("renders a double-digit month as YYYY-MM", () => {
    expect(monthKey(2026, 9)).toBe("2026-09");
    expect(monthKey(2026, 12)).toBe("2026-12");
  });

  it("zero-pads single-digit months", () => {
    expect(monthKey(2026, 1)).toBe("2026-01");
    expect(monthKey(2025, 11)).toBe("2025-11");
  });

  it("prefixes month ranges with the same key", () => {
    expect(monthRange(2026, 9).start.slice(0, 7)).toBe(monthKey(2026, 9));
  });
});

describe("formatMonthLabel", () => {
  it("renders the month name and year", () => {
    expect(formatMonthLabel(2026, 9)).toBe("September 2026");
  });

  it("renders single-digit months without padding artefacts", () => {
    expect(formatMonthLabel(2026, 1)).toBe("January 2026");
  });

  it("renders December of a previous year correctly", () => {
    expect(formatMonthLabel(2025, 12)).toBe("December 2025");
  });

  it("accepts another locale", () => {
    expect(formatMonthLabel(2026, 9, "fr-FR")).toContain("2026");
  });
});

describe("formatMonthName", () => {
  it("renders the month name on its own", () => {
    expect(formatMonthName(2026, 9)).toBe("September");
    expect(formatMonthName(2026, 2)).toBe("February");
  });

  it("omits the year so labels can sit in compact chips", () => {
    expect(formatMonthName(2026, 9)).not.toContain("2026");
  });
});