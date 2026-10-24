import { describe, expect, it } from "vitest";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { buildMonthlyReport } from "./monthly-report";

function makeTransaction(
  id: string,
  amount: number,
  type: Transaction["type"],
  categoryId: string,
  occurredOn: string,
  note?: string,
): Transaction {
  return { id, amount, type, categoryId, occurredOn, note };
}

function makeCategory(id: string, name: string, color: string): Category {
  return { id, name, color, kind: "expense" };
}

describe("buildMonthlyReport", () => {
  it("composes income/expense/balance and groups expenses by category for the month", () => {
    const transactions = [
      makeTransaction("t1", 500000, "income", "cat-salary", "2026-09-01", "Salary"),
      makeTransaction("t2", 45000, "expense", "cat-food", "2026-09-05", "Groceries"),
      makeTransaction("t3", 15000, "expense", "cat-food", "2026-09-12", "Snacks"),
      makeTransaction("t4", 30000, "expense", "cat-transport", "2026-09-10", "Fuel"),
    ];
    const categories = [
      makeCategory("cat-salary", "Salary", "#22c55e"),
      makeCategory("cat-food", "Food", "#f59e0b"),
      makeCategory("cat-transport", "Transport", "#3b82f6"),
    ];

    const report = buildMonthlyReport(transactions, categories, 2026, 9);

    expect(report.monthKey).toBe("2026-09");
    expect(report.income).toBe(500000);
    expect(report.expense).toBe(90000);
    expect(report.balance).toBe(410000);
    expect(report.transactions).toHaveLength(4);
    expect(report.categories[0]).toMatchObject({
      categoryId: "cat-food",
      categoryName: "Food",
      amount: 60000,
    });
    expect(report.categories[1]).toMatchObject({
      categoryId: "cat-transport",
      categoryName: "Transport",
      amount: 30000,
    });
  });

  it("falls back to Uncategorized when category is missing", () => {
    const transactions = [
      makeTransaction("t1", 10000, "expense", "missing", "2026-09-08"),
    ];
    const report = buildMonthlyReport(transactions, [], 2026, 9);
    expect(report.categories[0].categoryName).toBe("Uncategorized");
    expect(report.categories[0].categoryColor).toBe("#94a3b8");
  });

  it("excludes transactions from other months and years", () => {
    const transactions = [
      makeTransaction("t1", 10000, "expense", "cat-food", "2026-08-31"),
      makeTransaction("t2", 20000, "expense", "cat-food", "2026-09-01"),
      makeTransaction("t3", 30000, "expense", "cat-food", "2025-09-15"),
    ];
    const report = buildMonthlyReport(transactions, [], 2026, 9);
    expect(report.expense).toBe(20000);
    expect(report.transactions).toHaveLength(1);
  });

  it("returns zeros and empty lists when nothing matches", () => {
    const report = buildMonthlyReport([], [], 2026, 1);
    expect(report.income).toBe(0);
    expect(report.expense).toBe(0);
    expect(report.balance).toBe(0);
    expect(report.categories).toEqual([]);
    expect(report.transactions).toEqual([]);
  });
});
