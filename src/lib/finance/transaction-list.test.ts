import { describe, expect, it } from "vitest";
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
];

describe("buildTransactionList", () => {
  it("orders every transaction newest first", () => {
    const { rows, total } = buildTransactionList(
      TRANSACTIONS,
      CATEGORIES,
      REFERENCE_DATE,
    );

    expect(total).toBe(3);
    expect(rows.map((row) => row.id)).toEqual(["txn-3", "txn-2", "txn-1"]);
  });

  it("does not mutate the transactions it was given", () => {
    const source = [...TRANSACTIONS];

    buildTransactionList(source, CATEGORIES, REFERENCE_DATE);

    expect(source.map((transaction) => transaction.id)).toEqual([
      "txn-1",
      "txn-2",
      "txn-3",
    ]);
  });

  it("resolves each transaction's category name and color", () => {
    const { rows } = buildTransactionList(TRANSACTIONS, CATEGORIES, REFERENCE_DATE);

    expect(rows[0]).toMatchObject({
      note: "Weekly groceries",
      amount: 8635,
      type: "expense",
      categoryId: "cat-food",
      occurredOn: "2026-09-15",
      dateLabel: "Today",
      categoryName: "Food & dining",
      categoryColor: "#e11d48",
    });
  });

  it("labels dates relative to the reference day", () => {
    const { rows } = buildTransactionList(TRANSACTIONS, CATEGORIES, REFERENCE_DATE);

    expect(rows.map((row) => row.dateLabel)).toEqual([
      "Today",
      "Yesterday",
      "Tue, Sep 1",
    ]);
  });

  it("keeps the amount and type untouched for signed rendering", () => {
    const { rows } = buildTransactionList(TRANSACTIONS, CATEGORIES, REFERENCE_DATE);

    const income = rows.find((row) => row.type === "income");
    expect(income).toMatchObject({ amount: 240000, note: "Monthly salary" });
  });

  it("falls back to a placeholder note when the transaction has none", () => {
    const { rows } = buildTransactionList(
      [
        {
          id: "txn-4",
          amount: 2500,
          type: "expense",
          categoryId: "cat-food",
          occurredOn: "2026-09-15",
        },
        {
          id: "txn-5",
          amount: 2500,
          type: "expense",
          categoryId: "cat-food",
          note: "   ",
          occurredOn: "2026-09-15",
        },
      ],
      CATEGORIES,
      REFERENCE_DATE,
    );

    expect(rows.map((row) => row.note)).toEqual(["No note", "No note"]);
  });

  it("falls back to an uncategorized label when the category is missing", () => {
    const { rows } = buildTransactionList(
      [
        {
          id: "txn-6",
          amount: 999,
          type: "expense",
          categoryId: "cat-deleted",
          note: "Mystery",
          occurredOn: "2026-09-15",
        },
      ],
      CATEGORIES,
      REFERENCE_DATE,
    );

    expect(rows[0]).toMatchObject({
      categoryName: "Uncategorized",
      categoryColor: "#94a3b8",
    });
  });

  it("returns an empty list when the user has no transactions", () => {
    const { rows, total } = buildTransactionList([], CATEGORIES, REFERENCE_DATE);

    expect(rows).toEqual([]);
    expect(total).toBe(0);
  });

  it("keeps transactions from every month — the list is never month-scoped", () => {
    const { rows, total } = buildTransactionList(
      [
        ...TRANSACTIONS,
        {
          id: "txn-old",
          amount: 5000,
          type: "expense",
          categoryId: "cat-food",
          note: "August groceries",
          occurredOn: "2020-08-28",
        },
      ],
      CATEGORIES,
      REFERENCE_DATE,
    );

    expect(total).toBe(4);
    expect(rows.at(-1)?.id).toBe("txn-old");
  });

  it("is a pure function of its arguments", () => {
    const first = buildTransactionList(TRANSACTIONS, CATEGORIES, REFERENCE_DATE);
    const second = buildTransactionList(TRANSACTIONS, CATEGORIES, REFERENCE_DATE);

    expect(first).toEqual(second);
  });
});
