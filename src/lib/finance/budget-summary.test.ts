import { describe, expect, it } from "vitest";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { buildBudgetSummaries } from "./budget-summary";

const SEPTEMBER = { year: 2026, month: 9 };

const CATEGORIES: Category[] = [
  { id: "housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "food", name: "Food & dining", color: "#e11d48", kind: "expense" },
];

function makeBudget(
  limitAmount: number,
  categoryId: string,
  month = "2026-09",
): Budget {
  return { id: `${categoryId}-${month}`, categoryId, month, limitAmount };
}

function makeTransaction(
  amount: number,
  categoryId: string,
  occurredOn = "2026-09-12",
  type: Transaction["type"] = "expense",
): Transaction {
  return {
    id: `${categoryId}-${occurredOn}-${amount}`,
    amount,
    type,
    categoryId,
    occurredOn,
  };
}

describe("buildBudgetSummaries", () => {
  it("pairs each budget with its category and computed status", () => {
    const budgets = [makeBudget(130000, "housing"), makeBudget(35000, "food")];
    const transactions = [
      makeTransaction(115000, "housing"),
      makeTransaction(38240, "food"),
    ];

    expect(
      buildBudgetSummaries(budgets, transactions, CATEGORIES, SEPTEMBER),
    ).toEqual([
      {
        id: "housing-2026-09",
        categoryId: "housing",
        categoryName: "Housing",
        categoryColor: "#d97706",
        limit: 130000,
        spent: 115000,
        remaining: 15000,
        percent: 88,
        overBudget: false,
      },
      {
        id: "food-2026-09",
        categoryId: "food",
        categoryName: "Food & dining",
        categoryColor: "#e11d48",
        limit: 35000,
        spent: 38240,
        remaining: -3240,
        percent: 109,
        overBudget: true,
      },
    ]);
  });

  it("ignores budgets for other months", () => {
    const budgets = [
      makeBudget(130000, "housing", "2026-08"),
      makeBudget(35000, "food", "2026-09"),
    ];

    const rows = buildBudgetSummaries(budgets, [], CATEGORIES, SEPTEMBER);
    expect(rows.map((row) => row.id)).toEqual(["food-2026-09"]);
  });

  it("counts only expenses in the budget's category and month", () => {
    const budgets = [makeBudget(20000, "food")];
    const transactions = [
      makeTransaction(5000, "food", "2026-08-31"),
      makeTransaction(7000, "food", "2026-09-05"),
      makeTransaction(9000, "housing"),
      makeTransaction(3000, "food", "2026-09-20", "income"),
    ];

    const [food] = buildBudgetSummaries(
      budgets,
      transactions,
      CATEGORIES,
      SEPTEMBER,
    );
    expect(food.spent).toBe(7000);
    expect(food.remaining).toBe(13000);
  });

  it("falls back for a budget whose category no longer exists", () => {
    const budgets = [makeBudget(10000, "ghost")];

    const [row] = buildBudgetSummaries(budgets, [], CATEGORIES, SEPTEMBER);
    expect(row.categoryName).toBe("Uncategorized");
    expect(row.categoryColor).toBe("#94a3b8");
    expect(row.spent).toBe(0);
  });

  it("returns an empty array when there are no budgets", () => {
    expect(buildBudgetSummaries([], [], CATEGORIES, SEPTEMBER)).toEqual([]);
  });

  it("keeps the order the budgets were given in", () => {
    const budgets = [makeBudget(35000, "food"), makeBudget(130000, "housing")];

    const rows = buildBudgetSummaries(budgets, [], CATEGORIES, SEPTEMBER);
    expect(rows.map((row) => row.categoryId)).toEqual(["food", "housing"]);
  });
});
