import { describe, expect, it } from "vitest";
import {
  ALL_CATEGORIES,
  DEFAULT_TRANSACTION_FILTER,
  filterTransactions,
  isDefaultFilter,
} from "./transaction-filter";
import { buildTransactionList } from "./transaction-list";
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
    id: "txn-1",
    amount: 240000,
    type: "income",
    categoryId: "cat-salary",
    note: "Monthly salary",
    occurredOn: "2026-09-01",
  },
  {
    id: "txn-2",
    amount: 115000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-09-14",
  },
  {
    id: "txn-3",
    amount: 8635,
    type: "expense",
    categoryId: "cat-food",
    note: "Weekly groceries",
    occurredOn: "2026-09-15",
  },
  {
    id: "txn-4",
    amount: 50000,
    type: "income",
    categoryId: "cat-salary",
    note: "Bonus",
    occurredOn: "2026-08-30",
  },
];

const ROWS = buildTransactionList(TRANSACTIONS, CATEGORIES, REFERENCE_DATE).rows;

describe("filterTransactions", () => {
  it("keeps every row when nothing is filtered", () => {
    const visible = filterTransactions(ROWS, DEFAULT_TRANSACTION_FILTER);

    expect(visible.map((row) => row.id)).toEqual([
      "txn-3",
      "txn-2",
      "txn-1",
      "txn-4",
    ]);
  });

  it("keeps only income rows for the income type", () => {
    const visible = filterTransactions(ROWS, {
      type: "income",
      categoryId: ALL_CATEGORIES,
    });

    expect(visible.map((row) => row.id)).toEqual(["txn-1", "txn-4"]);
  });

  it("keeps only expense rows for the expense type", () => {
    const visible = filterTransactions(ROWS, {
      type: "expense",
      categoryId: ALL_CATEGORIES,
    });

    expect(visible.map((row) => row.id)).toEqual(["txn-3", "txn-2"]);
  });

  it("keeps only that category's rows", () => {
    const visible = filterTransactions(ROWS, {
      type: "all",
      categoryId: "cat-food",
    });

    expect(visible.map((row) => row.id)).toEqual(["txn-3"]);
  });

  it("keeps rows across months — the filter is not date-scoped", () => {
    const visible = filterTransactions(ROWS, {
      type: "income",
      categoryId: "cat-salary",
    });

    expect(visible.map((row) => row.id)).toEqual(["txn-1", "txn-4"]);
  });

  it("applies the type and category together", () => {
    const visible = filterTransactions(ROWS, {
      type: "income",
      categoryId: "cat-food",
    });

    expect(visible).toEqual([]);
  });

  it("returns an empty list when a category has no rows", () => {
    const visible = filterTransactions(ROWS, {
      type: "all",
      categoryId: "cat-gone",
    });

    expect(visible).toEqual([]);
  });

  it("returns an empty list when it is given nothing", () => {
    expect(filterTransactions([], DEFAULT_TRANSACTION_FILTER)).toEqual([]);
  });

  it("does not mutate the rows it was given", () => {
    const ids = ROWS.map((row) => row.id);

    filterTransactions(ROWS, { type: "expense", categoryId: ALL_CATEGORIES });

    expect(ROWS.map((row) => row.id)).toEqual(ids);
  });

  it("is a pure function of its arguments", () => {
    const criteria = { type: "expense" as const, categoryId: "cat-housing" };

    expect(filterTransactions(ROWS, criteria)).toEqual(
      filterTransactions(ROWS, criteria),
    );
  });
});

describe("isDefaultFilter", () => {
  it("is true when nothing is restricted", () => {
    expect(isDefaultFilter(DEFAULT_TRANSACTION_FILTER)).toBe(true);
  });

  it("is false once a type is chosen", () => {
    expect(isDefaultFilter({ type: "income", categoryId: ALL_CATEGORIES })).toBe(
      false,
    );
  });

  it("is false once a category is chosen", () => {
    expect(isDefaultFilter({ type: "all", categoryId: "cat-food" })).toBe(false);
  });
});
