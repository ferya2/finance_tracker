import { describe, expect, it } from "vitest";
import {
  matchesTransactionQuery,
  normalizeSearchQuery,
  searchTransactions,
} from "./transaction-search";
import {
  buildTransactionList,
  type TransactionListRow,
} from "./transaction-list";
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

/** One fixture row, so a typo in an id fails loudly instead of silently. */
function row(id: string): TransactionListRow {
  const found = ROWS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`No fixture row with id ${id}`);
  return found;
}

describe("normalizeSearchQuery", () => {
  it("lower-cases the query", () => {
    expect(normalizeSearchQuery("RENT")).toBe("rent");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeSearchQuery("  groceries \n")).toBe("groceries");
  });

  it("keeps whitespace inside the query", () => {
    expect(normalizeSearchQuery("food & dining")).toBe("food & dining");
  });

  it("is empty for a whitespace-only query", () => {
    expect(normalizeSearchQuery("   ")).toBe("");
  });
});

describe("matchesTransactionQuery", () => {
  it("matches the note, ignoring case", () => {
    expect(matchesTransactionQuery(row("txn-2"), "rent")).toBe(true);
  });

  it("matches the category name", () => {
    expect(matchesTransactionQuery(row("txn-3"), "food & dining")).toBe(true);
  });

  it("matches a partial word anywhere in the note", () => {
    expect(matchesTransactionQuery(row("txn-1"), "salar")).toBe(true);
  });

  it("tolerates extra whitespace around the query", () => {
    expect(matchesTransactionQuery(row("txn-3"), "  GROCERIES  ")).toBe(true);
  });

  it("rejects text that appears in neither field", () => {
    expect(matchesTransactionQuery(row("txn-2"), "groceries")).toBe(false);
  });

  it("rejects a category-word cross match", () => {
    expect(matchesTransactionQuery(row("txn-1"), "housing")).toBe(false);
  });

  it("accepts every row for an empty query", () => {
    for (const candidate of ROWS) {
      expect(matchesTransactionQuery(candidate, "")).toBe(true);
    }
  });

  it("accepts every row for a whitespace-only query", () => {
    for (const candidate of ROWS) {
      expect(matchesTransactionQuery(candidate, "   ")).toBe(true);
    }
  });
});

describe("searchTransactions", () => {
  it("keeps the rows whose note matches", () => {
    expect(searchTransactions(ROWS, "rent").map((row) => row.id)).toEqual([
      "txn-2",
    ]);
  });

  it("keeps the rows whose category matches, across rows", () => {
    expect(
      searchTransactions(ROWS, "salary").map((row) => row.id),
    ).toEqual(["txn-1", "txn-4"]);
  });

  it("keeps every row for an empty query", () => {
    expect(searchTransactions(ROWS, "")).toEqual(ROWS);
  });

  it("keeps every row for a whitespace-only query", () => {
    expect(searchTransactions(ROWS, "   ")).toEqual(ROWS);
  });

  it("returns an empty list when nothing matches", () => {
    expect(searchTransactions(ROWS, "xyzzy")).toEqual([]);
  });

  it("returns an empty list when it is given nothing", () => {
    expect(searchTransactions([], "rent")).toEqual([]);
  });

  it("preserves the order it was given", () => {
    const expected = ROWS.filter(
      (candidate) =>
        candidate.note.toLowerCase().includes("a") ||
        candidate.categoryName.toLowerCase().includes("a"),
    ).map((candidate) => candidate.id);

    expect(searchTransactions(ROWS, "a").map((r) => r.id)).toEqual(expected);
    expect(expected.length).toBeGreaterThan(1);
  });

  it("does not mutate the rows it was given", () => {
    const ids = ROWS.map((row) => row.id);

    searchTransactions(ROWS, "rent");

    expect(ROWS.map((row) => row.id)).toEqual(ids);
  });

  it("is a pure function of its arguments", () => {
    expect(searchTransactions(ROWS, "rent")).toEqual(
      searchTransactions(ROWS, "rent"),
    );
  });
});
