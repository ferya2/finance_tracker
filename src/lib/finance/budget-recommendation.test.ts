import { describe, expect, it } from "vitest";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import {
  BUDGET_RECOMMENDATION_LOOKBACK_MONTHS,
  recommendBudgets,
} from "./budget-recommendation";

const SEPTEMBER = { year: 2026, month: 9 };

const CATEGORIES: Category[] = [
  { id: "salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "transport", name: "Transport", color: "#0284c7", kind: "expense" },
  { id: "health", name: "Health", color: "#0d9488", kind: "expense" },
];

function expense(
  amount: number,
  categoryId: string,
  occurredOn: string,
): Transaction {
  return {
    id: `${categoryId}-${occurredOn}-${amount}`,
    amount,
    type: "expense",
    categoryId,
    occurredOn,
  };
}

function income(
  amount: number,
  categoryId: string,
  occurredOn: string,
): Transaction {
  return {
    id: `${categoryId}-${occurredOn}-${amount}`,
    amount,
    type: "income",
    categoryId,
    occurredOn,
  };
}

function budget(categoryId: string, month: string): Budget {
  return { id: `${categoryId}-${month}`, categoryId, month, limitAmount: 10000 };
}

const HISTORY: Transaction[] = [
  expense(90000, "housing", "2026-06-05"),
  expense(110000, "housing", "2026-07-05"),
  expense(100000, "housing", "2026-08-05"),
  expense(10000, "food", "2026-06-12"),
  expense(15000, "food", "2026-07-12"),
  expense(20000, "food", "2026-08-12"),
  expense(5000, "transport", "2026-08-20"),
  income(500000, "salary", "2026-06-01"),
  income(500000, "salary", "2026-07-01"),
  income(500000, "salary", "2026-08-01"),
];

describe("recommendBudgets", () => {
  it("averages the three completed months before the target month", () => {
    expect(recommendBudgets(HISTORY, CATEGORIES, SEPTEMBER)).toEqual([
      {
        categoryId: "housing",
        categoryName: "Housing",
        categoryColor: "#d97706",
        averageMonthlySpend: 100000,
        suggestedLimit: 100000,
        monthsConsidered: 3,
        monthsWithSpending: 3,
      },
      {
        categoryId: "food",
        categoryName: "Food & dining",
        categoryColor: "#e11d48",
        averageMonthlySpend: 15000,
        suggestedLimit: 15000,
        monthsConsidered: 3,
        monthsWithSpending: 3,
      },
      {
        categoryId: "transport",
        categoryName: "Transport",
        categoryColor: "#0284c7",
        averageMonthlySpend: 1667,
        suggestedLimit: 1700,
        monthsConsidered: 3,
        monthsWithSpending: 1,
      },
    ]);
  });

  it("uses the documented default lookback window", () => {
    expect(BUDGET_RECOMMENDATION_LOOKBACK_MONTHS).toBe(3);
    expect(recommendBudgets(HISTORY, CATEGORIES, SEPTEMBER)[0].monthsConsidered).toBe(3);
  });

  it("ignores the target month and spending older than the window", () => {
    const transactions = [
      expense(888888, "housing", "2026-05-31"),
      expense(30000, "housing", "2026-08-10"),
      expense(999999, "housing", "2026-09-01"),
    ];

    expect(recommendBudgets(transactions, CATEGORIES, SEPTEMBER)).toEqual([
      {
        categoryId: "housing",
        categoryName: "Housing",
        categoryColor: "#d97706",
        averageMonthlySpend: 10000,
        suggestedLimit: 10000,
        monthsConsidered: 3,
        monthsWithSpending: 1,
      },
    ]);
  });

  it("ignores income transactions and income categories", () => {
    const transactions = [income(500000, "salary", "2026-08-01")];

    expect(recommendBudgets(transactions, CATEGORIES, SEPTEMBER)).toEqual([]);
  });

  it("omits expense categories with no spending history", () => {
    const recommendations = recommendBudgets(HISTORY, CATEGORIES, SEPTEMBER);

    expect(
      recommendations.find((item) => item.categoryId === "health"),
    ).toBeUndefined();
  });

  it("skips categories already budgeted for the target month", () => {
    const transactions = [
      expense(30000, "housing", "2026-08-10"),
      expense(20000, "food", "2026-08-11"),
    ];

    const recommendations = recommendBudgets(
      transactions,
      CATEGORIES,
      SEPTEMBER,
      { budgets: [budget("housing", "2026-09")] },
    );

    expect(recommendations.map((item) => item.categoryId)).toEqual(["food"]);
  });

  it("does not skip a category budgeted for another month", () => {
    const transactions = [expense(30000, "housing", "2026-08-10")];

    const recommendations = recommendBudgets(
      transactions,
      CATEGORIES,
      SEPTEMBER,
      { budgets: [budget("housing", "2026-08")] },
    );

    expect(recommendations.map((item) => item.categoryId)).toEqual([
      "housing",
    ]);
  });

  it("can include categories that already have a budget", () => {
    const transactions = [
      expense(30000, "housing", "2026-08-10"),
      expense(20000, "food", "2026-08-11"),
    ];
    const budgets = [
      budget("housing", "2026-09"),
      budget("food", "2026-09"),
    ];

    expect(
      recommendBudgets(transactions, CATEGORIES, SEPTEMBER, { budgets }),
    ).toEqual([]);
    expect(
      recommendBudgets(transactions, CATEGORIES, SEPTEMBER, {
        budgets,
        includeBudgeted: true,
      }).map((item) => item.categoryId),
    ).toEqual(["housing", "food"]);
  });

  it("respects a custom lookback window", () => {
    const transactions = [
      expense(90000, "housing", "2026-07-10"),
      expense(30000, "housing", "2026-08-10"),
    ];

    expect(
      recommendBudgets(transactions, CATEGORIES, SEPTEMBER, {
        lookbackMonths: 1,
      }),
    ).toEqual([
      {
        categoryId: "housing",
        categoryName: "Housing",
        categoryColor: "#d97706",
        averageMonthlySpend: 30000,
        suggestedLimit: 30000,
        monthsConsidered: 1,
        monthsWithSpending: 1,
      },
    ]);
  });

  it("clamps a non-positive lookback window to one month", () => {
    const transactions = [
      expense(90000, "housing", "2026-07-10"),
      expense(30000, "housing", "2026-08-10"),
    ];

    const [recommendation] = recommendBudgets(
      transactions,
      CATEGORIES,
      SEPTEMBER,
      { lookbackMonths: 0 },
    );

    expect(recommendation.averageMonthlySpend).toBe(30000);
    expect(recommendation.monthsConsidered).toBe(1);
  });

  it("rounds the average up to a whole currency unit", () => {
    const transactions = [
      expense(1000, "food", "2026-06-01"),
      expense(1701, "food", "2026-07-01"),
      expense(1000, "food", "2026-08-01"),
    ];

    const [recommendation] = recommendBudgets(
      transactions,
      CATEGORIES,
      SEPTEMBER,
    );

    expect(recommendation.averageMonthlySpend).toBe(1234);
    expect(recommendation.suggestedLimit).toBe(1300);
  });

  it("rolls the lookback across a year boundary", () => {
    const transactions = [
      expense(10000, "housing", "2026-10-10"),
      expense(20000, "housing", "2026-11-10"),
      expense(30000, "housing", "2026-12-10"),
      expense(999999, "housing", "2027-01-02"),
    ];

    expect(
      recommendBudgets(transactions, CATEGORIES, {
        year: 2027,
        month: 1,
      }),
    ).toEqual([
      {
        categoryId: "housing",
        categoryName: "Housing",
        categoryColor: "#d97706",
        averageMonthlySpend: 20000,
        suggestedLimit: 20000,
        monthsConsidered: 3,
        monthsWithSpending: 3,
      },
    ]);
  });

  it("returns nothing when there are no transactions", () => {
    expect(recommendBudgets([], CATEGORIES, SEPTEMBER)).toEqual([]);
  });
});
