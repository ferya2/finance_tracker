import { describe, expect, it } from "vitest";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import {
  buildDateRangeReport,
  filterByDateRange,
  formatDateRangeLabel,
  isIsoDate,
  isValidDateRange,
  lastNDaysRange,
  rangeDays,
  rangeGranularity,
} from "./date-range";

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: "sep-salary",
    amount: 500000,
    type: "income",
    categoryId: "cat-salary",
    note: "Monthly salary",
    occurredOn: "2026-09-01",
  },
  {
    id: "sep-housing",
    amount: 115000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-09-04",
  },
  {
    id: "sep-food",
    amount: 15000,
    type: "expense",
    categoryId: "cat-food",
    note: "Groceries",
    occurredOn: "2026-09-20",
  },
  {
    id: "aug-food",
    amount: 20000,
    type: "expense",
    categoryId: "cat-food",
    note: "Groceries",
    occurredOn: "2026-08-15",
  },
];

describe("isIsoDate", () => {
  it("accepts real ISO calendar dates", () => {
    expect(isIsoDate("2026-09-15")).toBe(true);
    expect(isIsoDate("2024-02-29")).toBe(true);
  });

  it("rejects malformed or impossible dates", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-9-15")).toBe(false);
    expect(isIsoDate("15-09-2026")).toBe(false);
    expect(isIsoDate("not-a-date")).toBe(false);
  });
});

describe("isValidDateRange", () => {
  it("accepts a start on or before the end", () => {
    expect(
      isValidDateRange({ start: "2026-09-01", end: "2026-09-30" }),
    ).toBe(true);
    expect(
      isValidDateRange({ start: "2026-09-15", end: "2026-09-15" }),
    ).toBe(true);
  });

  it("rejects an inverted range or an invalid end", () => {
    expect(
      isValidDateRange({ start: "2026-09-30", end: "2026-09-01" }),
    ).toBe(false);
    expect(
      isValidDateRange({ start: "2026-09-01", end: "nonsense" }),
    ).toBe(false);
  });
});

describe("rangeDays", () => {
  it("counts both ends of the range", () => {
    expect(rangeDays({ start: "2026-09-01", end: "2026-09-30" })).toBe(30);
    expect(rangeDays({ start: "2026-09-15", end: "2026-09-15" })).toBe(1);
  });

  it("crosses month and year boundaries", () => {
    expect(rangeDays({ start: "2026-12-31", end: "2027-01-02" })).toBe(3);
  });

  it("reports zero for an invalid range", () => {
    expect(rangeDays({ start: "2026-09-30", end: "2026-09-01" })).toBe(0);
  });
});

describe("lastNDaysRange", () => {
  it("ends on the given day and counts it as the last day", () => {
    expect(lastNDaysRange("2026-09-15", 30)).toEqual({
      start: "2026-08-17",
      end: "2026-09-15",
    });
  });

  it("covers a single day when asked for one", () => {
    expect(lastNDaysRange("2026-09-15", 1)).toEqual({
      start: "2026-09-15",
      end: "2026-09-15",
    });
  });

  it("falls back to a single day for an unusable end or count", () => {
    expect(lastNDaysRange("nonsense", 30)).toEqual({
      start: "nonsense",
      end: "nonsense",
    });
    expect(lastNDaysRange("2026-09-15", 0)).toEqual({
      start: "2026-09-15",
      end: "2026-09-15",
    });
  });
});

describe("filterByDateRange", () => {
  it("keeps the rows inside the inclusive range", () => {
    const rows = filterByDateRange(TRANSACTIONS, {
      start: "2026-09-01",
      end: "2026-09-20",
    });

    expect(rows.map((row) => row.id)).toEqual([
      "sep-salary",
      "sep-housing",
      "sep-food",
    ]);
  });

  it("includes rows on both boundary days", () => {
    const rows = filterByDateRange(TRANSACTIONS, {
      start: "2026-09-04",
      end: "2026-09-20",
    });

    expect(rows.map((row) => row.id)).toEqual(["sep-housing", "sep-food"]);
  });

  it("returns nothing for an invalid range", () => {
    expect(
      filterByDateRange(TRANSACTIONS, {
        start: "2026-09-30",
        end: "2026-09-01",
      }),
    ).toEqual([]);
  });

  it("drops rows with an unusable date", () => {
    const rows = filterByDateRange(
      [
        {
          id: "broken",
          amount: 100,
          type: "expense",
          categoryId: "cat-food",
          occurredOn: "not-a-date",
        },
        TRANSACTIONS[0],
      ],
      { start: "2026-09-01", end: "2026-09-30" },
    );

    expect(rows.map((row) => row.id)).toEqual(["sep-salary"]);
  });

  it("does not mutate the input", () => {
    const rows = [...TRANSACTIONS];

    filterByDateRange(rows, { start: "2026-09-01", end: "2026-09-30" });

    expect(rows).toEqual(TRANSACTIONS);
  });
});

describe("rangeGranularity", () => {
  it("uses days for short ranges", () => {
    expect(
      rangeGranularity({ start: "2026-09-01", end: "2026-09-30" }),
    ).toBe("day");
  });

  it("uses weeks for ranges up to about a year", () => {
    expect(
      rangeGranularity({ start: "2026-01-01", end: "2026-12-31" }),
    ).toBe("week");
  });

  it("uses months for ranges longer than about a year", () => {
    expect(
      rangeGranularity({ start: "2025-01-01", end: "2026-12-31" }),
    ).toBe("month");
  });
});

describe("formatDateRangeLabel", () => {
  it("shows a single day once", () => {
    expect(
      formatDateRangeLabel({ start: "2026-09-15", end: "2026-09-15" }),
    ).toBe("Sep 15, 2026");
  });

  it("shares the year for a range inside one year", () => {
    expect(
      formatDateRangeLabel({ start: "2026-09-01", end: "2026-09-30" }),
    ).toBe("Sep 1 – Sep 30, 2026");
  });

  it("spells out both years when the range crosses a year boundary", () => {
    expect(
      formatDateRangeLabel({ start: "2025-12-20", end: "2026-01-10" }),
    ).toBe("Dec 20, 2025 – Jan 10, 2026");
  });

  it("falls back to the raw values for an invalid range", () => {
    expect(
      formatDateRangeLabel({ start: "2026-09-30", end: "2026-09-01" }),
    ).toBe("2026-09-30 – 2026-09-01");
  });
});

describe("buildDateRangeReport", () => {
  const source = {
    transactions: TRANSACTIONS,
    categories: CATEGORIES,
  };

  it("summarizes income, expenses and net across the range", () => {
    const report = buildDateRangeReport(source, {
      start: "2026-09-01",
      end: "2026-09-30",
    });

    expect(report.summary).toEqual({
      income: 500000,
      expense: 130000,
      balance: 370000,
    });
    expect(report.label).toBe("Sep 1 – Sep 30, 2026");
    expect(report.transactionCount).toBe(3);
    expect(report.days).toBe(30);
    expect(report.dailyAverageExpense).toBe(4333);
  });

  it("excludes transactions outside the range", () => {
    const report = buildDateRangeReport(source, {
      start: "2026-09-05",
      end: "2026-09-20",
    });

    expect(report.summary).toEqual({
      income: 0,
      expense: 15000,
      balance: -15000,
    });
    expect(report.transactionCount).toBe(1);
  });

  it("groups spending by category, biggest first, with its share", () => {
    const { categories } = buildDateRangeReport(source, {
      start: "2026-09-01",
      end: "2026-09-30",
    });

    expect(categories).toEqual([
      {
        categoryId: "cat-housing",
        categoryName: "Housing",
        categoryColor: "#d97706",
        amount: 115000,
        sharePercent: 88,
      },
      {
        categoryId: "cat-food",
        categoryName: "Food & dining",
        categoryColor: "#e11d48",
        amount: 15000,
        sharePercent: 12,
      },
    ]);
  });

  it("falls back gracefully for an unknown category", () => {
    const report = buildDateRangeReport(
      {
        transactions: [
          {
            id: "misc",
            amount: 5000,
            type: "expense",
            categoryId: "cat-missing",
            occurredOn: "2026-09-10",
          },
        ],
        categories: CATEGORIES,
      },
      { start: "2026-09-01", end: "2026-09-30" },
    );

    expect(report.topCategory).toMatchObject({
      categoryName: "Uncategorized",
      categoryColor: "#94a3b8",
    });
  });

  it("builds a trend over the whole range at the chosen granularity", () => {
    const report = buildDateRangeReport(source, {
      start: "2026-09-01",
      end: "2026-09-30",
    });

    expect(report.granularity).toBe("day");
    expect(report.trend).toHaveLength(30);
    expect(report.trend[0]).toMatchObject({
      key: "2026-09-01",
      income: 500000,
      expense: 0,
    });
    expect(report.trend[3]).toMatchObject({
      key: "2026-09-04",
      expense: 115000,
    });
  });

  it("handles an empty range", () => {
    const report = buildDateRangeReport(
      { transactions: [], categories: CATEGORIES },
      { start: "2026-09-01", end: "2026-09-30" },
    );

    expect(report.summary).toEqual({ income: 0, expense: 0, balance: 0 });
    expect(report.categories).toEqual([]);
    expect(report.topCategory).toBeNull();
    expect(report.transactionCount).toBe(0);
    expect(report.dailyAverageExpense).toBe(0);
  });

  it("handles an invalid range without throwing", () => {
    const report = buildDateRangeReport(source, {
      start: "2026-09-30",
      end: "2026-09-01",
    });

    expect(report.summary).toEqual({ income: 0, expense: 0, balance: 0 });
    expect(report.days).toBe(0);
    expect(report.trend).toEqual([]);
    expect(report.dailyAverageExpense).toBe(0);
  });

  it("does not mutate the source rows", () => {
    const transactions = [...TRANSACTIONS];
    const categories = [...CATEGORIES];

    buildDateRangeReport(
      { transactions, categories },
      { start: "2026-09-01", end: "2026-09-30" },
    );

    expect(transactions).toEqual(TRANSACTIONS);
    expect(categories).toEqual(CATEGORIES);
  });
});
