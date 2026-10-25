import { describe, expect, it } from "vitest";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { buildMonthlyReport } from "./monthly-report";

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: "sep-salary",
    amount: 500000,
    type: "income",
    categoryId: "cat-salary",
    note: "Monthly salary",
    occurredOn: "2026-09-01",
  },
  {
    id: "sep-housing",
    amount: 115000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-09-04",
  },
  {
    id: "sep-food-1",
    amount: 10000,
    type: "expense",
    categoryId: "cat-food",
    note: "Groceries",
    occurredOn: "2026-09-05",
  },
  {
    id: "sep-food-2",
    amount: 5000,
    type: "expense",
    categoryId: "cat-food",
    note: "Takeout",
    occurredOn: "2026-09-20",
  },
  {
    id: "aug-salary",
    amount: 400000,
    type: "income",
    categoryId: "cat-salary",
    note: "Monthly salary",
    occurredOn: "2026-08-01",
  },
  {
    id: "aug-food",
    amount: 20000,
    type: "expense",
    categoryId: "cat-food",
    note: "Groceries",
    occurredOn: "2026-08-15",
  },
];

const BUDGETS: Budget[] = [
  {
    id: "budget-housing",
    categoryId: "cat-housing",
    month: "2026-09",
    limitAmount: 130000,
  },
  {
    id: "budget-food",
    categoryId: "cat-food",
    month: "2026-09",
    limitAmount: 12000,
  },
  {
    id: "budget-august",
    categoryId: "cat-housing",
    month: "2026-08",
    limitAmount: 130000,
  },
];

function september() {
  return buildMonthlyReport(
    { transactions: TRANSACTIONS, categories: CATEGORIES, budgets: BUDGETS },
    { year: 2026, month: 9 },
  );
}

describe("buildMonthlyReport", () => {
  it("labels the month and the month it is compared with", () => {
    const report = september();

    expect(report.period).toEqual({ year: 2026, month: 9 });
    expect(report.monthLabel).toBe("September 2026");
    expect(report.monthName).toBe("September");
    expect(report.previousMonthName).toBe("August");
  });

  it("summarizes the month's income, expenses and net", () => {
    const { summary } = september();

    expect(summary).toEqual({
      income: 500000,
      expense: 130000,
      balance: 370000,
    });
  });

  it("summarizes the previous month for comparison", () => {
    const { previousSummary } = september();

    expect(previousSummary).toEqual({
      income: 400000,
      expense: 20000,
      balance: 380000,
    });
  });

  it("reports the month-over-month change in income and expenses", () => {
    const report = september();

    expect(report.incomeChangePercent).toBe(25);
    expect(report.expenseChangePercent).toBe(550);
  });

  it("groups spending by category, biggest first, with its share", () => {
    const { categories } = september();

    expect(categories).toEqual([
      {
        categoryId: "cat-housing",
        categoryName: "Housing",
        categoryColor: "#d97706",
        amount: 115000,
        sharePercent: 88,
      },
      {
        categoryId: "cat-food",
        categoryName: "Food & dining",
        categoryColor: "#e11d48",
        amount: 15000,
        sharePercent: 12,
      },
    ]);
  });

  it("falls back gracefully for an unknown category", () => {
    const report = buildMonthlyReport(
      {
        transactions: [
          {
            id: "sep-misc",
            amount: 5000,
            type: "expense",
            categoryId: "cat-missing",
            occurredOn: "2026-09-10",
          },
        ],
        categories: CATEGORIES,
        budgets: [],
      },
      { year: 2026, month: 9 },
    );

    expect(report.categories[0]).toMatchObject({
      categoryName: "Uncategorized",
      categoryColor: "#94a3b8",
    });
  });

  it("builds a daily trend for every day of the month", () => {
    const { daily } = september();

    expect(daily).toHaveLength(30);
    expect(daily[0]).toMatchObject({
      key: "2026-09-01",
      income: 500000,
      expense: 0,
      count: 1,
    });
    expect(daily[3]).toMatchObject({ key: "2026-09-04", expense: 115000 });
    expect(daily[4]).toMatchObject({ key: "2026-09-05", expense: 10000 });
    expect(daily[19]).toMatchObject({ key: "2026-09-20", expense: 5000 });
    expect(daily[29]).toMatchObject({ key: "2026-09-30", expense: 0 });
  });

  it("keeps only the month's budgets and rolls them up", () => {
    const report = september();

    expect(report.budgets.map((budget) => budget.id)).toEqual([
      "budget-housing",
      "budget-food",
    ]);
    expect(report.budgetTotals).toEqual({
      limit: 142000,
      spent: 130000,
      remaining: 12000,
      percent: 92,
      tracked: 2,
      overBudgetCount: 1,
      pressure: "over",
    });
  });

  it("reports the transaction count and average spend per day", () => {
    const report = september();

    expect(report.transactionCount).toBe(4);
    expect(report.dailyAverageExpense).toBe(4333);
  });

  it("names the biggest spending category", () => {
    expect(september().topCategory?.categoryName).toBe("Housing");
  });

  it("handles a month with no activity", () => {
    const report = buildMonthlyReport(
      { transactions: [], categories: CATEGORIES, budgets: [] },
      { year: 2026, month: 9 },
    );

    expect(report.summary).toEqual({ income: 0, expense: 0, balance: 0 });
    expect(report.incomeChangePercent).toBeNull();
    expect(report.expenseChangePercent).toBeNull();
    expect(report.categories).toEqual([]);
    expect(report.daily).toHaveLength(30);
    expect(report.daily.every((day) => day.count === 0)).toBe(true);
    expect(report.budgets).toEqual([]);
    expect(report.transactionCount).toBe(0);
    expect(report.dailyAverageExpense).toBe(0);
    expect(report.topCategory).toBeNull();
  });

  it("does not mutate the source rows", () => {
    const transactions = [...TRANSACTIONS];
    const categories = [...CATEGORIES];
    const budgets = [...BUDGETS];

    buildMonthlyReport({ transactions, categories, budgets }, { year: 2026, month: 9 });

    expect(transactions.map((transaction) => transaction.id)).toEqual(
      TRANSACTIONS.map((transaction) => transaction.id),
    );
    expect(categories.map((category) => category.id)).toEqual(
      CATEGORIES.map((category) => category.id),
    );
    expect(budgets.map((budget) => budget.id)).toEqual(
      BUDGETS.map((budget) => budget.id),
    );
  });
});
