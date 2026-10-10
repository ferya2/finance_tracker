import { describe, expect, it } from "vitest";
import {
  ALL_MONTHS,
  filterByMonth,
  formatMonthKeyLabel,
  matchesMonth,
  monthKeyOf,
  monthOptions,
  type MonthFilter,
} from "./transaction-month";
import { buildTransactionList, type TransactionListRow } from "./transaction-list";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";

const REFERENCE_DATE = "2026-09-15";

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: "txn-sep-1",
    amount: 240000,
    type: "income",
    categoryId: "cat-salary",
    note: "Monthly salary",
    occurredOn: "2026-09-01",
  },
  {
    id: "txn-sep-2",
    amount: 8635,
    type: "expense",
    categoryId: "cat-food",
    note: "Weekly groceries",
    occurredOn: "2026-09-15",
  },
  {
    id: "txn-aug-1",
    amount: 50000,
    type: "income",
    categoryId: "cat-salary",
    note: "Bonus",
    occurredOn: "2026-08-30",
  },
  {
    id: "txn-jul-1",
    amount: 115000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-07-03",
  },
];

const ROWS = buildTransactionList(TRANSACTIONS, CATEGORIES, REFERENCE_DATE).rows;

/** One fixture row, so a typo in an id fails loudly instead of silently. */
function row(id: string): TransactionListRow {
  const found = ROWS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`No fixture row with id ${id}`);
  return found;
}

/** The ids of a result list, for compact assertions. */
function ids(rows: readonly TransactionListRow[]): string[] {
  return rows.map((candidate) => candidate.id);
}

describe("monthKeyOf", () => {
  it("extracts the YYYY-MM key from a date", () => {
    expect(monthKeyOf("2026-09-15")).toBe("2026-09");
  });

  it("keeps the zero padding of a single-digit month", () => {
    expect(monthKeyOf("2026-07-03")).toBe("2026-07");
  });
});

describe("matchesMonth", () => {
  it("accepts every row when no month is selected", () => {
    for (const candidate of ROWS) {
      expect(matchesMonth(candidate, ALL_MONTHS)).toBe(true);
    }
  });

  it("accepts only that month's rows", () => {
    expect(matchesMonth(row("txn-sep-1"), "2026-09")).toBe(true);
    expect(matchesMonth(row("txn-aug-1"), "2026-09")).toBe(false);
  });

  it("rejects every row when the month is not present", () => {
    for (const candidate of ROWS) {
      expect(matchesMonth(candidate, "2026-12")).toBe(false);
    }
  });
});

describe("filterByMonth", () => {
  it("keeps every row when no month is selected, in order", () => {
    expect(ids(filterByMonth(ROWS, ALL_MONTHS))).toEqual([
      "txn-sep-2",
      "txn-sep-1",
      "txn-aug-1",
      "txn-jul-1",
    ]);
  });

  it("keeps only the selected month's rows", () => {
    expect(ids(filterByMonth(ROWS, "2026-09"))).toEqual([
      "txn-sep-2",
      "txn-sep-1",
    ]);
  });

  it("keeps only the older month's rows", () => {
    expect(ids(filterByMonth(ROWS, "2026-07"))).toEqual(["txn-jul-1"]);
  });

  it("returns an empty list for a month with no rows", () => {
    expect(filterByMonth(ROWS, "2026-12")).toEqual([]);
  });

  it("returns an empty list when it is given nothing", () => {
    expect(filterByMonth([], "2026-09")).toEqual([]);
  });

  it("does not mutate the rows it was given", () => {
    const before = ids(ROWS);

    filterByMonth(ROWS, "2026-09");

    expect(ids(ROWS)).toEqual(before);
  });

  it("is a pure function of its arguments", () => {
    const filter: MonthFilter = "2026-09";

    expect(filterByMonth(ROWS, filter)).toEqual(filterByMonth(ROWS, filter));
  });
});

describe("monthOptions", () => {
  it("lists the distinct months present, newest first", () => {
    expect(monthOptions(ROWS)).toEqual(["2026-09", "2026-08", "2026-07"]);
  });

  it("counts each month once even when it appears many times", () => {
    const crowded = [row("txn-sep-1"), row("txn-sep-2"), row("txn-aug-1")];
    expect(monthOptions(crowded)).toEqual(["2026-09", "2026-08"]);
  });

  it("returns an empty list when there are no rows", () => {
    expect(monthOptions([])).toEqual([]);
  });
});

describe("formatMonthKeyLabel", () => {
  it("labels a month key with its month and year", () => {
    expect(formatMonthKeyLabel("2026-09")).toBe("September 2026");
  });

  it("labels an early-year month correctly", () => {
    expect(formatMonthKeyLabel("2026-01")).toBe("January 2026");
  });
});