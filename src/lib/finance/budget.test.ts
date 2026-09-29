import { describe, expect, it } from "vitest";
import type { Transaction } from "@/types/transaction";
import {
  BUDGET_WARNING_PERCENT,
  budgetPressure,
  budgetStatus,
  summarizeBudgets,
  type BudgetProgressRow,
} from "./budget";

function makeTransaction(
  amount: number,
  type: Transaction["type"],
  categoryId: string,
  occurredOn: string,
): Transaction {
  return { id: "txn", amount, type, categoryId, occurredOn };
}

const transactions: Transaction[] = [
  makeTransaction(115000, "expense", "cat-housing", "2026-09-04"),
  makeTransaction(8635, "expense", "cat-food", "2026-09-10"),
  makeTransaction(240000, "income", "cat-salary", "2026-09-01"),
  makeTransaction(7000, "expense", "cat-shopping", "2026-09-18"),
  makeTransaction(12050, "expense", "cat-food", "2026-09-06"),
];

describe("budgetStatus", () => {
  it("reports spent, remaining, percent and overBudget for a within-limit budget", () => {
    expect(budgetStatus(transactions, "cat-food", 2026, 9, 35000)).toEqual({
      spent: 20685,
      remaining: 14315,
      percent: 59,
      overBudget: false,
    });
  });

  it("flags a budget as over budget when spent exceeds the limit", () => {
    expect(budgetStatus(transactions, "cat-food", 2026, 9, 20000)).toEqual({
      spent: 20685,
      remaining: -685,
      percent: 103,
      overBudget: true,
    });
  });

  it("reaches exactly 100 percent at the limit without being over budget", () => {
    expect(budgetStatus(transactions, "cat-food", 2026, 9, 20685)).toEqual({
      spent: 20685,
      remaining: 0,
      percent: 100,
      overBudget: false,
    });
  });

  it("counts expenses only in the budget's category", () => {
    expect(budgetStatus(transactions, "cat-housing", 2026, 9, 130000)).toEqual({
      spent: 115000,
      remaining: 15000,
      percent: 88,
      overBudget: false,
    });
  });

  it("ignores income transactions even in the budget's category", () => {
    expect(budgetStatus(transactions, "cat-salary", 2026, 9, 200000)).toEqual({
      spent: 0,
      remaining: 200000,
      percent: 0,
      overBudget: false,
    });
  });

  it("excludes transactions from other months and years", () => {
    const mixed = [
      makeTransaction(1000, "expense", "cat-food", "2026-08-31"),
      makeTransaction(2000, "expense", "cat-food", "2026-09-01"),
      makeTransaction(4000, "expense", "cat-food", "2025-09-10"),
    ];
    expect(budgetStatus(mixed, "cat-food", 2026, 9, 10000)).toEqual({
      spent: 2000,
      remaining: 8000,
      percent: 20,
      overBudget: false,
    });
  });

  it("distinguishes single-digit months from their double-digit cousins", () => {
    const mixed = [
      makeTransaction(1000, "expense", "cat-food", "2026-01-20"),
      makeTransaction(1000, "expense", "cat-food", "2026-10-20"),
    ];
    expect(budgetStatus(mixed, "cat-food", 2026, 1, 5000)).toEqual({
      spent: 1000,
      remaining: 4000,
      percent: 20,
      overBudget: false,
    });
  });

  it("reports zero spent for an empty list", () => {
    expect(budgetStatus([], "cat-food", 2026, 9, 30000)).toEqual({
      spent: 0,
      remaining: 30000,
      percent: 0,
      overBudget: false,
    });
  });

  it("gives a zero percent and over-budget flag for a zero limit with spending", () => {
    expect(budgetStatus(transactions, "cat-food", 2026, 9, 0)).toEqual({
      spent: 20685,
      remaining: -20685,
      percent: 0,
      overBudget: true,
    });
  });

  it("gives a zero percent and no over-budget flag for a negative limit without spending", () => {
    expect(budgetStatus([], "cat-food", 2026, 9, -500)).toEqual({
      spent: 0,
      remaining: -500,
      percent: 0,
      overBudget: false,
    });
  });
});

function makeBudgetRow(
  limit: number,
  spent: number,
): BudgetProgressRow {
  return {
    limit,
    spent,
    remaining: limit - spent,
    percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
    overBudget: spent > 0 && spent > limit,
  };
}

describe("budgetPressure", () => {
  it("keeps a comfortably funded budget on track", () => {
    expect(budgetPressure(makeBudgetRow(35000, 20685))).toBe("onTrack");
  });

  it("warns once the budget reaches the warning percent", () => {
    const row = makeBudgetRow(10000, 8000);

    expect(BUDGET_WARNING_PERCENT).toBe(80);
    expect(budgetPressure(row)).toBe("warning");
  });

  it("stays on track just below the warning percent", () => {
    expect(budgetPressure(makeBudgetRow(10000, 7900))).toBe("onTrack");
  });

  it("reports over budget ahead of the warning percent", () => {
    expect(budgetPressure(makeBudgetRow(10000, 12000))).toBe("over");
  });

  it("reports over budget for a zero limit that has been spent from", () => {
    expect(budgetPressure(makeBudgetRow(0, 500))).toBe("over");
  });
});

describe("summarizeBudgets", () => {
  it("adds up the limits, spending and headroom of every tracked budget", () => {
    expect(
      summarizeBudgets([makeBudgetRow(130000, 115000), makeBudgetRow(50000, 8635)]),
    ).toEqual({
      limit: 180000,
      spent: 123635,
      remaining: 56365,
      percent: 69,
      tracked: 2,
      overBudgetCount: 0,
      pressure: "onTrack",
    });
  });

  it("counts how many budgets have been exceeded", () => {
    const totals = summarizeBudgets([
      makeBudgetRow(130000, 115000),
      makeBudgetRow(5000, 8635),
    ]);

    expect(totals.overBudgetCount).toBe(1);
    expect(totals.remaining).toBe(11365);
    expect(totals.pressure).toBe("over");
  });

  it("colours the month by the share of its limits that is spent", () => {
    const rows = [makeBudgetRow(100000, 10000), makeBudgetRow(50000, 40000)];
    expect(summarizeBudgets(rows).pressure).toBe("onTrack");
    expect(summarizeBudgets([makeBudgetRow(100000, 90000)]).pressure).toBe("warning");
    expect(summarizeBudgets([makeBudgetRow(100000, 120000)]).pressure).toBe("over");
  });

  it("totals to zero for a month without any budgets", () => {
    expect(summarizeBudgets([])).toEqual({
      limit: 0,
      spent: 0,
      remaining: 0,
      percent: 0,
      tracked: 0,
      overBudgetCount: 0,
      pressure: "onTrack",
    });
  });

  it("does not mutate the rows it is given", () => {
    const rows = [makeBudgetRow(130000, 115000)];

    summarizeBudgets(rows);

    expect(rows[0]).toEqual(makeBudgetRow(130000, 115000));
  });
});