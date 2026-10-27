import { describe, expect, it } from "vitest";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { buildYearlyReport } from "./yearly";

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: "jan-salary",
    amount: 300000,
    type: "income",
    categoryId: "cat-salary",
    note: "Salary",
    occurredOn: "2026-01-01",
  },
  {
    id: "jan-food",
    amount: 10000,
    type: "expense",
    categoryId: "cat-food",
    note: "Groceries",
    occurredOn: "2026-01-10",
  },
  {
    id: "feb-salary",
    amount: 300000,
    type: "income",
    categoryId: "cat-salary",
    note: "Salary",
    occurredOn: "2026-02-01",
  },
  {
    id: "feb-housing",
    amount: 80000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-02-05",
  },
  {
    id: "mar-food",
    amount: 5000,
    type: "expense",
    categoryId: "cat-food",
    note: "Takeout",
    occurredOn: "2026-03-15",
  },
];

describe("buildYearlyReport", () => {
  it("builds a 12-month summary for the year", () => {
    const report = buildYearlyReport(
      { transactions: TRANSACTIONS, categories: CATEGORIES },
      2026,
    );

    expect(report.year).toBe(2026);
    expect(report.months).toHaveLength(12);
    expect(report.months[0].monthKey).toBe("2026-01");
    expect(report.months[0].monthName).toBe("January");
  });

  it("summarizes income and expenses per month", () => {
    const report = buildYearlyReport(
      { transactions: TRANSACTIONS, categories: CATEGORIES },
      2026,
    );

    expect(report.months[0]).toMatchObject({
      income: 300000,
      expense: 10000,
      net: 290000,
      transactionCount: 2,
    });
    expect(report.months[1]).toMatchObject({
      income: 300000,
      expense: 80000,
      net: 220000,
    });
  });

  it("computes totals and averages", () => {
    const report = buildYearlyReport(
      { transactions: TRANSACTIONS, categories: CATEGORIES },
      2026,
    );

    expect(report.totalIncome).toBe(600000);
    expect(report.totalExpense).toBe(95000);
    expect(report.totalBalance).toBe(505000);
    expect(report.averageMonthlyIncome).toBe(50000);
    expect(report.averageMonthlyExpense).toBe(7917);
  });

  it("groups expenses by category for the year", () => {
    const report = buildYearlyReport(
      { transactions: TRANSACTIONS, categories: CATEGORIES },
      2026,
    );

    expect(report.categories[0].categoryName).toBe("Housing");
    expect(report.categories[0].amount).toBe(80000);
    expect(report.categories[1].categoryName).toBe("Food & dining");
    expect(report.categories[1].amount).toBe(15000);
    expect(report.topCategory?.categoryName).toBe("Housing");
  });

  it("computes daily average expense across the year", () => {
    const report = buildYearlyReport(
      { transactions: TRANSACTIONS, categories: CATEGORIES },
      2026,
    );

    expect(report.totalDays).toBe(365);
    expect(report.dailyAverageExpense).toBe(Math.round(95000 / 365));
  });
});
