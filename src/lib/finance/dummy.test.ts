import { describe, expect, it } from "vitest";
import {
  DUMMY_BUDGETS,
  DUMMY_CATEGORIES,
  DUMMY_CATEGORY_BREAKDOWN,
  DUMMY_CATEGORY_TOTALS,
  DUMMY_INSIGHTS,
  DUMMY_MONTHLY_SERIES,
  DUMMY_RECENT_TRANSACTIONS,
  DUMMY_SUMMARY,
  DUMMY_TRANSACTIONS,
  getDummyCategory,
} from "@/lib/finance/dummy";

describe("dummy dashboard data", () => {
  it("keeps all summary amounts as non-negative cents", () => {
    expect(Object.values(DUMMY_SUMMARY).every((value) => value >= 0)).toBe(true);
    expect(DUMMY_SUMMARY.totalBalance).toBeGreaterThan(DUMMY_SUMMARY.monthlyExpense);
    expect(DUMMY_SUMMARY.monthlyIncome).toBeGreaterThan(DUMMY_SUMMARY.monthlyExpense);
  });

  it("makes the category breakdown add up to the monthly expense", () => {
    const total = DUMMY_CATEGORY_BREAKDOWN.reduce(
      (sum, category) => sum + category.amount,
      0,
    );
    expect(total).toBe(DUMMY_SUMMARY.monthlyExpense);
  });

  it("checks every category has a unique id, a color and a kind", () => {
    expect(new Set(DUMMY_CATEGORIES.map((category) => category.id)).size).toBe(
      DUMMY_CATEGORIES.length,
    );
    for (const category of DUMMY_CATEGORIES) {
      expect(category.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(["income", "expense"]).toContain(category.kind);
    }
  });

  it("only references known categories", () => {
    const ids = [
      ...DUMMY_CATEGORY_BREAKDOWN.map((item) => item.categoryId),
      ...DUMMY_BUDGETS.map((budget) => budget.categoryId),
      ...DUMMY_RECENT_TRANSACTIONS.map((txn) => txn.categoryId),
    ];
    for (const id of ids) {
      expect(getDummyCategory(id)).toBeDefined();
    }
  });

  it("reports budget percent consistent with spent and limit", () => {
    for (const budget of DUMMY_BUDGETS) {
      expect(budget.limit).toBeGreaterThan(0);
      const expected = Math.round((budget.spent / budget.limit) * 100);
      expect(budget.percent).toBe(expected);
    }
  });

  it("keeps transactions on valid types with positive amounts", () => {
    for (const txn of DUMMY_RECENT_TRANSACTIONS) {
      expect(["income", "expense"]).toContain(txn.type);
      expect(txn.amount).toBeGreaterThan(0);
      expect(txn.occurredOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("looks up categories by id and returns undefined for unknown ids", () => {
    expect(getDummyCategory("cat-food")).toEqual(
      DUMMY_CATEGORIES.find((category) => category.id === "cat-food"),
    );
    expect(getDummyCategory("nope")).toBeUndefined();
  });

  it("starts the full transaction log with the recent transactions", () => {
    expect(DUMMY_TRANSACTIONS.length).toBeGreaterThan(
      DUMMY_RECENT_TRANSACTIONS.length,
    );
    expect(DUMMY_RECENT_TRANSACTIONS).toEqual(DUMMY_TRANSACTIONS.slice(0, 6));
    expect(new Set(DUMMY_TRANSACTIONS.map((txn) => txn.id)).size).toBe(
      DUMMY_TRANSACTIONS.length,
    );
  });

  it("reconciles the full transaction log with the monthly summary", () => {
    const income = DUMMY_TRANSACTIONS.filter((txn) => txn.type === "income").reduce(
      (sum, txn) => sum + txn.amount,
      0,
    );
    const expense = DUMMY_TRANSACTIONS.filter(
      (txn) => txn.type === "expense",
    ).reduce((sum, txn) => sum + txn.amount, 0);
    expect(income).toBe(DUMMY_SUMMARY.monthlyIncome);
    expect(expense).toBe(DUMMY_SUMMARY.monthlyExpense);
  });

  it("reconciles per-category totals with the category breakdown", () => {
    const expenseTotal = DUMMY_CATEGORY_TOTALS.filter(
      (item) => item.type === "expense",
    ).reduce((sum, item) => sum + item.amount, 0);
    const incomeTotal = DUMMY_CATEGORY_TOTALS.filter(
      (item) => item.type === "income",
    ).reduce((sum, item) => sum + item.amount, 0);
    expect(expenseTotal).toBe(DUMMY_SUMMARY.monthlyExpense);
    expect(incomeTotal).toBe(DUMMY_SUMMARY.monthlyIncome);

    for (const item of DUMMY_CATEGORY_TOTALS) {
      expect(getDummyCategory(item.categoryId)).toBeDefined();
      expect(item.amount).toBeGreaterThan(0);
      const breakdown = DUMMY_CATEGORY_BREAKDOWN.find(
        (entry) => entry.categoryId === item.categoryId,
      );
      if (item.type === "expense") {
        expect(breakdown).toBeDefined();
        expect(breakdown?.amount).toBe(item.amount);
      }
    }
  });

  it("keeps the monthly series balanced and trending down on spending", () => {
    expect(DUMMY_MONTHLY_SERIES).toHaveLength(6);
    for (const point of DUMMY_MONTHLY_SERIES) {
      expect(point.balance).toBe(point.income - point.expense);
      expect(point.income).toBeGreaterThan(0);
      expect(point.expense).toBeGreaterThan(0);
    }
    const expenses = DUMMY_MONTHLY_SERIES.map((point) => point.expense);
    expect(expenses[expenses.length - 1]).toBe(Math.min(...expenses));
    const last = DUMMY_MONTHLY_SERIES[DUMMY_MONTHLY_SERIES.length - 1];
    expect(last.income).toBe(DUMMY_SUMMARY.monthlyIncome);
    expect(last.balance).toBe(DUMMY_SUMMARY.totalBalance);
  });

  it("keeps insights sane and referenced", () => {
    expect(DUMMY_INSIGHTS.averageDailySpend).toBeGreaterThan(0);
    expect(DUMMY_INSIGHTS.biggestExpenseAmount).toBeGreaterThan(0);
    const housing = DUMMY_CATEGORY_TOTALS.find(
      (item) => item.categoryId === "cat-housing",
    );
    expect(housing?.amount).toBe(DUMMY_INSIGHTS.biggestExpenseAmount);
    expect(DUMMY_INSIGHTS.savingsRatePercent).toBeGreaterThan(0);
    expect(DUMMY_INSIGHTS.savingsRatePercent).toBeLessThanOrEqual(100);
    expect(DUMMY_INSIGHTS.tips.length).toBeGreaterThanOrEqual(3);
  });
});