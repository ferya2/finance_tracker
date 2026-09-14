import { describe, expect, it } from "vitest";
import type { Transaction } from "@/types/transaction";
import { sumByCategory } from "./by-category";

function makeTransaction(
  amount: number,
  type: Transaction["type"],
  categoryId: string,
): Transaction {
  return { id: "txn", amount, type, categoryId, occurredOn: "2026-09-12" };
}

describe("sumByCategory", () => {
  it("sums amounts per category, sorted descending", () => {
    const transactions = [
      makeTransaction(115000, "expense", "food"),
      makeTransaction(50000, "expense", "rent"),
      makeTransaction(25000, "expense", "food"),
      makeTransaction(10000, "expense", "transport"),
    ];
    expect(sumByCategory(transactions)).toEqual([
      { categoryId: "food", total: 140000 },
      { categoryId: "rent", total: 50000 },
      { categoryId: "transport", total: 10000 },
    ]);
  });

  it("returns an empty array for an empty list", () => {
    expect(sumByCategory([])).toEqual([]);
  });

  it("omits categories with no matching transactions", () => {
    const transactions = [makeTransaction(1000, "income", "salary")];
    expect(sumByCategory(transactions, "expense")).toEqual([]);
  });

  it("filters by an income type when given", () => {
    const transactions = [
      makeTransaction(300000, "income", "salary"),
      makeTransaction(1500, "income", "side"),
      makeTransaction(25000, "expense", "food"),
    ];
    expect(sumByCategory(transactions, "income")).toEqual([
      { categoryId: "salary", total: 300000 },
      { categoryId: "side", total: 1500 },
    ]);
  });

  it("filters by an expense type when given", () => {
    const transactions = [
      makeTransaction(300000, "income", "salary"),
      makeTransaction(25000, "expense", "food"),
      makeTransaction(8635, "expense", "fun"),
    ];
    expect(sumByCategory(transactions, "expense")).toEqual([
      { categoryId: "food", total: 25000 },
      { categoryId: "fun", total: 8635 },
    ]);
  });

  it("groups a single transaction by its category", () => {
    expect(sumByCategory([makeTransaction(1234, "expense", "fun")])).toEqual([
      { categoryId: "fun", total: 1234 },
    ]);
  });

  it("stays deterministic when totals are equal", () => {
    const transactions = [
      makeTransaction(1000, "expense", "a"),
      makeTransaction(1000, "expense", "b"),
    ];
    expect(sumByCategory(transactions)).toEqual([
      { categoryId: "a", total: 1000 },
      { categoryId: "b", total: 1000 },
    ]);
  });
});