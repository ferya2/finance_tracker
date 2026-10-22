import { describe, expect, it } from "vitest";
import {
  buildIncomeExpenseSeries,
  INCOME_EXPENSE_MONTHS,
} from "./income-expense";

function expense(amount: number, occurredOn: string) {
  return { amount, type: "expense" as const, occurredOn };
}

function income(amount: number, occurredOn: string) {
  return { amount, type: "income" as const, occurredOn };
}

describe("buildIncomeExpenseSeries", () => {
  it("groups income and expense into one point per month", () => {
    const series = buildIncomeExpenseSeries(
      [
        income(500000, "2026-09-01"),
        expense(1200, "2026-09-02"),
        expense(4500, "2026-09-03"),
      ],
      { end: "2026-09-30" },
    );

    expect(series.points).toHaveLength(INCOME_EXPENSE_MONTHS);
    expect(series.points[series.points.length - 1]).toEqual({
      key: "2026-09",
      label: "Sep",
      income: 500000,
      expense: 5700,
      balance: 494300,
    });
  });

  it("keeps empty months so the grouped bars keep their place", () => {
    const series = buildIncomeExpenseSeries([], { end: "2026-09-15" });

    expect(series.points.map((point) => point.key)).toEqual([
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    expect(series.points.every((point) => point.balance === 0)).toBe(true);
    expect(series.max).toBe(0);
  });

  it("adds the year to labels when the window spans years", () => {
    const series = buildIncomeExpenseSeries([], {
      end: "2026-02-28",
      months: 4,
    });

    expect(series.points.map((point) => point.label)).toEqual([
      "Nov 25",
      "Dec 25",
      "Jan 26",
      "Feb 26",
    ]);
  });

  it("scales to the tallest income or expense bar", () => {
    const series = buildIncomeExpenseSeries(
      [income(300000, "2026-08-01"), expense(120000, "2026-09-01")],
      { end: "2026-09-30" },
    );

    expect(series.max).toBe(300000);
  });

  it("totals income, expense and balance across the window", () => {
    const series = buildIncomeExpenseSeries(
      [
        income(300000, "2026-08-01"),
        expense(120000, "2026-08-02"),
        income(200000, "2026-09-01"),
        expense(50000, "2026-09-02"),
      ],
      { end: "2026-09-30" },
    );

    expect(series.totals).toEqual({
      income: 500000,
      expense: 170000,
      balance: 330000,
    });
  });

  it("ignores transactions outside the window", () => {
    const series = buildIncomeExpenseSeries(
      [income(999999, "2026-03-31"), expense(1000, "2026-09-01")],
      { end: "2026-09-30" },
    );

    expect(series.totals.income).toBe(0);
    expect(series.totals.expense).toBe(1000);
    expect(series.max).toBe(1000);
  });

  it("covers a custom number of months", () => {
    const series = buildIncomeExpenseSeries([], {
      end: "2026-09-30",
      months: 3,
    });

    expect(series.points.map((point) => point.key)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
  });

  it("shows at least one month", () => {
    const series = buildIncomeExpenseSeries([], {
      end: "2026-09-30",
      months: 0,
    });

    expect(series.points.map((point) => point.key)).toEqual(["2026-09"]);
  });

  it("returns nothing for an unusable end date", () => {
    expect(
      buildIncomeExpenseSeries([income(1000, "2026-09-01")], {
        end: "nonsense",
      }),
    ).toEqual({
      points: [],
      max: 0,
      totals: { income: 0, expense: 0, balance: 0 },
    });
  });

  it("leaves the transactions it was given untouched", () => {
    const transactions = [income(1000, "2026-09-01")];

    buildIncomeExpenseSeries(transactions, { end: "2026-09-30" });

    expect(transactions).toEqual([income(1000, "2026-09-01")]);
  });
});
