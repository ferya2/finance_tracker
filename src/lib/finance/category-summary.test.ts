import { describe, expect, it } from "vitest";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { buildCategorySummaries } from "./category-summary";

const SEPTEMBER = { year: 2026, month: 9 };

const CATEGORIES: Category[] = [
  { id: "salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "food", name: "Food & dining", color: "#e11d48", kind: "expense" },
];

function makeTransaction(
  amount: number,
  categoryId: string,
  occurredOn = "2026-09-12",
): Transaction {
  return { id: `${categoryId}-${occurredOn}-${amount}`, amount, type: "expense", categoryId, occurredOn };
}

describe("buildCategorySummaries", () => {
  it("pairs every category with its total for the month", () => {
    const transactions = [
      makeTransaction(240000, "salary"),
      makeTransaction(115000, "housing"),
      makeTransaction(38240, "food"),
    ];

    expect(buildCategorySummaries(transactions, CATEGORIES, SEPTEMBER)).toEqual([
      { id: "salary", name: "Salary", color: "#059669", kind: "income", total: 240000 },
      { id: "housing", name: "Housing", color: "#d97706", kind: "expense", total: 115000 },
      { id: "food", name: "Food & dining", color: "#e11d48", kind: "expense", total: 38240 },
    ]);
  });

  it("sums several transactions in the same category", () => {
    const transactions = [
      makeTransaction(12050, "food"),
      makeTransaction(8455, "food"),
    ];

    const totals = buildCategorySummaries(transactions, CATEGORIES, SEPTEMBER);
    expect(totals.find((row) => row.id === "food")?.total).toBe(20505);
  });

  it("totals a category with no transactions that month to zero", () => {
    const totals = buildCategorySummaries([], CATEGORIES, SEPTEMBER);

    expect(totals).toHaveLength(CATEGORIES.length);
    expect(totals.every((row) => row.total === 0)).toBe(true);
  });

  it("ignores transactions outside the requested month", () => {
    const transactions = [
      makeTransaction(5000, "food", "2026-08-31"),
      makeTransaction(1250, "food", "2026-09-30"),
      makeTransaction(9999, "food", "2026-10-01"),
    ];

    const totals = buildCategorySummaries(transactions, CATEGORIES, SEPTEMBER);
    expect(totals.find((row) => row.id === "food")?.total).toBe(1250);
  });

  it("does not invent rows for unknown categories", () => {
    const transactions = [makeTransaction(7777, "ghost")];

    const totals = buildCategorySummaries(transactions, CATEGORIES, SEPTEMBER);
    expect(totals.map((row) => row.id)).toEqual(["salary", "housing", "food"]);
  });

  it("returns an empty array when there are no categories", () => {
    const transactions = [makeTransaction(1000, "food")];
    expect(buildCategorySummaries(transactions, [], SEPTEMBER)).toEqual([]);
  });

  it("keeps the order the categories were given in", () => {
    const reversed = [...CATEGORIES].reverse();
    const totals = buildCategorySummaries([], reversed, SEPTEMBER);
    expect(totals.map((row) => row.id)).toEqual(["food", "housing", "salary"]);
  });
});
