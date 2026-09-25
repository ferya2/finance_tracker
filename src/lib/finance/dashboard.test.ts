import { describe, expect, it } from "vitest";
import { buildDashboardData, RECENT_TRANSACTION_LIMIT } from "./dashboard";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";

const PERIOD = { year: 2026, month: 9 };

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
];

const TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    amount: 240000,
    type: "income",
    categoryId: "cat-salary",
    note: "Monthly salary",
    occurredOn: "2026-09-01",
  },
  {
    id: "txn-2",
    amount: 115000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-09-04",
  },
  {
    id: "txn-3",
    amount: 8635,
    type: "expense",
    categoryId: "cat-food",
    note: "Weekly groceries",
    occurredOn: "2026-09-10",
  },
  {
    id: "txn-4",
    amount: 5000,
    type: "expense",
    categoryId: "cat-food",
    note: "August groceries",
    occurredOn: "2026-08-28",
  },
  {
    id: "txn-5",
    amount: 10000,
    type: "income",
    categoryId: "cat-salary",
    note: "August salary",
    occurredOn: "2026-08-01",
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
    limitAmount: 5000,
  },
  {
    id: "budget-old",
    categoryId: "cat-housing",
    month: "2026-08",
    limitAmount: 130000,
  },
];

function build() {
  return buildDashboardData(
    { transactions: TRANSACTIONS, categories: CATEGORIES, budgets: BUDGETS },
    PERIOD,
  );
}

describe("buildDashboardData", () => {
  it("labels the period it was given", () => {
    const data = build();

    expect(data.period).toEqual(PERIOD);
    expect(data.monthLabel).toBe("September 2026");
    expect(data.monthName).toBe("September");
  });

  it("balances every transaction but scopes income and expense to the month", () => {
    const data = build();

    expect(data.summary).toEqual({
      totalBalance: 250000 - 128635,
      monthlyIncome: 240000,
      monthlyExpense: 123635,
    });
  });

  it("lists the newest transactions first", () => {
    const data = build();

    expect(data.recent.map((row) => row.id)).toEqual([
      "txn-3",
      "txn-2",
      "txn-1",
      "txn-4",
      "txn-5",
    ]);
  });

  it("caps the recent list and keeps the newest rows when it overflows", () => {
    const many: Transaction[] = Array.from({ length: 10 }, (_, index) => ({
      id: `txn-${index}`,
      amount: 100,
      type: "expense" as const,
      categoryId: "cat-food",
      note: `Spend ${index}`,
      occurredOn: `2026-09-${String(index + 1).padStart(2, "0")}`,
    }));

    const data = buildDashboardData(
      { transactions: many, categories: CATEGORIES, budgets: [] },
      PERIOD,
    );

    expect(data.recent).toHaveLength(RECENT_TRANSACTION_LIMIT);
    expect(data.recent[0]?.id).toBe("txn-9");
    expect(data.recent.at(-1)?.id).toBe("txn-4");
  });

  it("resolves the category name and color on each recent row", () => {
    const [newest] = build().recent;

    expect(newest).toMatchObject({
      note: "Weekly groceries",
      categoryName: "Food & dining",
      categoryColor: "#e11d48",
      type: "expense",
      amount: 8635,
    });
  });

  it("falls back to a placeholder note and category for unknown rows", () => {
    const data = buildDashboardData(
      {
        transactions: [
          {
            id: "txn-orphan",
            amount: 2500,
            type: "expense",
            categoryId: "cat-gone",
            note: "   ",
            occurredOn: "2026-09-02",
          },
        ],
        categories: [],
        budgets: [],
      },
      PERIOD,
    );

    expect(data.recent[0]).toMatchObject({
      note: "No note",
      categoryName: "Uncategorized",
      categoryColor: "#94a3b8",
    });
    expect(data.breakdown[0]).toMatchObject({
      categoryName: "Uncategorized",
    });
  });

  it("breaks the month's expenses down per category, biggest first", () => {
    const data = build();

    expect(
      data.breakdown.map((row) => ({
        categoryName: row.categoryName,
        amount: row.amount,
      })),
    ).toEqual([
      { categoryName: "Housing", amount: 115000 },
      { categoryName: "Food & dining", amount: 8635 },
    ]);
  });

  it("expresses each category as a share of the month's expenses", () => {
    const data = build();

    expect(
      data.breakdown.map((row) => row.sharePercent),
    ).toEqual([93, 7]);
  });

  it("ignores income and other months in the breakdown", () => {
    const data = build();

    expect(
      data.breakdown.some((row) => row.categoryName === "Salary"),
    ).toBe(false);
  });

  it("keeps only the budgets for the given month, with their status", () => {
    const data = build();

    expect(data.budgets.map((row) => row.id)).toEqual([
      "budget-housing",
      "budget-food",
    ]);
    expect(data.budgets[0]).toEqual({
      id: "budget-housing",
      categoryId: "cat-housing",
      categoryName: "Housing",
      categoryColor: "#d97706",
      limit: 130000,
      spent: 115000,
      remaining: 15000,
      percent: 88,
      overBudget: false,
    });
  });

  it("flags a budget as over budget when the month's spending exceeds it", () => {
    const over = build().budgets[1];

    expect(over).toMatchObject({
      spent: 8635,
      remaining: -3635,
      percent: 173,
      overBudget: true,
    });
  });

  it("returns an empty but valid view model for a brand new user", () => {
    const data = buildDashboardData(
      { transactions: [], categories: [], budgets: [] },
      PERIOD,
    );

    expect(data.summary).toEqual({
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
    });
    expect(data.recent).toEqual([]);
    expect(data.breakdown).toEqual([]);
    expect(data.budgets).toEqual([]);
  });

  it("reports zero shares when a month has expenses outside the categories", () => {
    const data = buildDashboardData(
      {
        transactions: [],
        categories: CATEGORIES,
        budgets: [
          { id: "b", categoryId: "cat-food", month: "2026-09", limitAmount: 0 },
        ],
      },
      PERIOD,
    );

    expect(data.breakdown).toEqual([]);
    expect(data.budgets[0]).toMatchObject({
      spent: 0,
      percent: 0,
      overBudget: false,
      remaining: 0,
    });
  });

  it("does not mutate the source arrays", () => {
    const order = TRANSACTIONS.map((transaction) => transaction.id);
    build();
    expect(TRANSACTIONS.map((transaction) => transaction.id)).toEqual(order);
  });
});
