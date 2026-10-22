import { describe, expect, it } from "vitest";
import {
  buildSpendingTrend,
  TREND_WINDOW_SIZES,
  trendAverage,
  trendPeak,
  trendTotals,
  trendWindow,
  type TrendPoint,
} from "./trend";

function expense(amount: number, occurredOn: string) {
  return { amount, type: "expense" as const, occurredOn };
}

function income(amount: number, occurredOn: string) {
  return { amount, type: "income" as const, occurredOn };
}

describe("buildSpendingTrend", () => {
  it("buckets spending into one point per day", () => {
    const points = buildSpendingTrend(
      [expense(1000, "2026-09-01"), expense(2500, "2026-09-01")],
      { granularity: "day", start: "2026-09-01", end: "2026-09-03" },
    );

    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({
      key: "2026-09-01",
      label: "1 Sep",
      income: 0,
      expense: 3500,
      count: 2,
    });    expect(points[1].expense).toBe(0);
    expect(points[2].expense).toBe(0);
  });

  it("keeps empty buckets so the line never skips a gap", () => {
    const points = buildSpendingTrend([], {
      granularity: "day",
      start: "2026-09-01",
      end: "2026-09-05",
    });

    expect(points.map((point) => point.key)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
    ]);
    expect(points.every((point) => point.expense === 0)).toBe(true);
  });

  it("adds up the spending of a bucket", () => {
    const points = buildSpendingTrend(
      [expense(1000, "2026-09-02"), expense(2000, "2026-09-03")],
      { granularity: "day", start: "2026-09-01", end: "2026-09-04" },
    );

    expect(points.map((point) => point.expense)).toEqual([0, 1000, 2000, 0]);
  });

  it("keeps income and expense apart", () => {
    const points = buildSpendingTrend(
      [income(500000, "2026-09-01"), expense(1200, "2026-09-01")],
      { granularity: "day", start: "2026-09-01", end: "2026-09-01" },
    );

    expect(points[0].income).toBe(500000);
    expect(points[0].expense).toBe(1200);
    expect(points[0].count).toBe(2);
  });

  it("groups a week into the week it starts on Monday", () => {
    const points = buildSpendingTrend(
      [expense(1000, "2026-09-14"), expense(2000, "2026-09-16")],
      { granularity: "week", start: "2026-09-14", end: "2026-09-20" },
    );

    expect(points).toHaveLength(1);
    expect(points[0].key).toBe("2026-09-14");
    expect(points[0].expense).toBe(3000);
    expect(points[0].count).toBe(2);
  });

  it("keeps a Sunday with the week that started on the Monday before", () => {
    const points = buildSpendingTrend(
      [expense(1000, "2026-09-13"), expense(2000, "2026-09-16")],
      { granularity: "week", start: "2026-09-13", end: "2026-09-19" },
    );

    expect(points.map((point) => point.key)).toEqual([
      "2026-09-07",
      "2026-09-14",
    ]);
    expect(points[0].expense).toBe(1000);
    expect(points[1].expense).toBe(2000);
  });

  it("splits a week range into one point per week", () => {
    const points = buildSpendingTrend([], {
      granularity: "week",
      start: "2026-09-01",
      end: "2026-09-20",
    });

    expect(points.map((point) => point.key)).toEqual([
      "2026-08-31",
      "2026-09-07",
      "2026-09-14",
    ]);
  });

  it("groups a month into the month it falls in", () => {
    const points = buildSpendingTrend(
      [expense(1000, "2026-09-01"), expense(2000, "2026-09-30")],
      { granularity: "month", start: "2026-09-01", end: "2026-09-30" },
    );

    expect(points).toHaveLength(1);
    expect(points[0].key).toBe("2026-09");
    expect(points[0].label).toBe("Sep");
    expect(points[0].expense).toBe(3000);
  });

  it("splits a month range into one point per month", () => {
    const points = buildSpendingTrend([], {
      granularity: "month",
      start: "2026-07-15",
      end: "2026-09-02",
    });

    expect(points.map((point) => point.key)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
  });

  it("adds the year to month labels when the range spans years", () => {
    const points = buildSpendingTrend([], {
      granularity: "month",
      start: "2025-11-01",
      end: "2026-02-28",
    });

    expect(points.map((point) => point.label)).toEqual([
      "Nov 25",
      "Dec 25",
      "Jan 26",
      "Feb 26",
    ]);
  });

  it("ignores transactions outside the range", () => {
    const points = buildSpendingTrend(
      [expense(1000, "2026-08-31"), expense(2000, "2026-09-02")],
      { granularity: "day", start: "2026-09-01", end: "2026-09-03" },
    );

    expect(points.map((point) => point.expense)).toEqual([0, 2000, 0]);
  });

  it("ignores transactions with an unusable date", () => {
    const points = buildSpendingTrend(
      [expense(1000, "not-a-date"), expense(2000, "2026-09-02")],
      { granularity: "day", start: "2026-09-01", end: "2026-09-03" },
    );

    expect(points.map((point) => point.expense)).toEqual([0, 2000, 0]);
  });

  it("returns nothing for an empty or inverted range", () => {
    expect(
      buildSpendingTrend([expense(1000, "2026-09-01")], {
        granularity: "day",
        start: "2026-09-10",
        end: "2026-09-01",
      }),
    ).toEqual([]);

    expect(
      buildSpendingTrend([expense(1000, "2026-09-01")], {
        granularity: "day",
        start: "nonsense",
        end: "2026-09-01",
      }),
    ).toEqual([]);
  });

  it("leaves the transactions it was given untouched", () => {
    const transactions = [expense(1000, "2026-09-01")];

    buildSpendingTrend(transactions, {
      granularity: "day",
      start: "2026-09-01",
      end: "2026-09-01",
    });

    expect(transactions).toEqual([expense(1000, "2026-09-01")]);
  });
});

describe("trendWindow", () => {
  it("looks back 30 days for the daily trend", () => {
    expect(trendWindow("day", "2026-09-15")).toEqual({
      start: "2026-08-17",
      end: "2026-09-15",
    });
  });

  it("looks back 12 weeks, starting on a Monday, for the weekly trend", () => {
    expect(trendWindow("week", "2026-09-15")).toEqual({
      start: "2026-06-29",
      end: "2026-09-15",
    });
  });

  it("looks back 12 months for the monthly trend", () => {
    expect(trendWindow("month", "2026-09-15")).toEqual({
      start: "2025-10-01",
      end: "2026-09-15",
    });
  });

  it("keeps the window length in step with the published sizes", () => {
    const window = trendWindow("day", "2026-09-15");
    const points = buildSpendingTrend([], {
      granularity: "day",
      start: window.start,
      end: window.end,
    });

    expect(points).toHaveLength(TREND_WINDOW_SIZES.day);
  });

  it("falls back to the given day when it is not a date", () => {
    expect(trendWindow("day", "nonsense")).toEqual({
      start: "nonsense",
      end: "nonsense",
    });
  });
});

describe("trendTotals", () => {
  it("adds up the income and expense of every bucket", () => {
    const points: TrendPoint[] = [
      { key: "a", label: "a", income: 1000, expense: 400, count: 2 },
      { key: "b", label: "b", income: 2000, expense: 100, count: 1 },
    ];

    expect(trendTotals(points)).toEqual({
      income: 3000,
      expense: 500,
      balance: 2500,
    });
  });

  it("reports zeroes for an empty trend", () => {
    expect(trendTotals([])).toEqual({ income: 0, expense: 0, balance: 0 });
  });
});

describe("trendAverage", () => {
  it("averages the spending across the buckets", () => {
    const points: TrendPoint[] = [
      { key: "a", label: "a", income: 0, expense: 1000, count: 1 },
      { key: "b", label: "b", income: 0, expense: 500, count: 1 },
    ];

    expect(trendAverage(points)).toBe(750);
  });

  it("reports zero for an empty trend", () => {
    expect(trendAverage([])).toBe(0);
  });
});

describe("trendPeak", () => {
  it("finds the bucket with the most spending", () => {
    const points: TrendPoint[] = [
      { key: "a", label: "a", income: 0, expense: 1000, count: 1 },
      { key: "b", label: "b", income: 0, expense: 2500, count: 3 },
      { key: "c", label: "c", income: 0, expense: 500, count: 1 },
    ];

    expect(trendPeak(points)?.key).toBe("b");
    expect(trendPeak(points)?.expense).toBe(2500);
  });

  it("reports nothing when nothing was spent", () => {
    const points: TrendPoint[] = [
      { key: "a", label: "a", income: 900, expense: 0, count: 1 },
    ];

    expect(trendPeak(points)).toBeNull();
    expect(trendPeak([])).toBeNull();
  });
});
