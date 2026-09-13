import { describe, expect, it } from "vitest";
import {
  DUMMY_BUDGETS,
  DUMMY_CATEGORIES,
  DUMMY_CATEGORY_BREAKDOWN,
  DUMMY_RECENT_TRANSACTIONS,
  DUMMY_SUMMARY,
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
});