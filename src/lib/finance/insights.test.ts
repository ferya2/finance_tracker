import { describe, expect, it } from "vitest";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";
import { buildInsights, INSIGHT_TOP_CATEGORY_LIMIT } from "./insights";
import { daysInMonth } from "./period";

const PERIOD = { year: 2026, month: 9 };

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-transport", name: "Transport", color: "#0284c7", kind: "expense" },
  { id: "cat-shopping", name: "Shopping", color: "#7c3aed", kind: "expense" },
  { id: "cat-fun", name: "Entertainment", color: "#db2777", kind: "expense" },
  { id: "cat-health", name: "Health", color: "#0d9488", kind: "expense" },
];

function transaction(
  overrides: Partial<Transaction> & Pick<Transaction, "amount" | "occurredOn">,
): Transaction {
  return {
    id: `txn-${overrides.occurredOn}-${overrides.amount}`,
    type: "expense",
    categoryId: "cat-food",
    ...overrides,
  };
}

const TRANSACTIONS: Transaction[] = [
  transaction({
    amount: 500000,
    type: "income",
    categoryId: "cat-salary",
    note: "Monthly salary",
    occurredOn: "2026-09-01",
  }),
  transaction({
    amount: 115000,
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-09-04",
  }),
  transaction({ amount: 10000, categoryId: "cat-food", occurredOn: "2026-09-05" }),
  transaction({ amount: 5000, categoryId: "cat-food", occurredOn: "2026-09-20" }),
  transaction({
    amount: 8000,
    categoryId: "cat-transport",
    occurredOn: "2026-09-10",
  }),
  transaction({ amount: 4000, categoryId: "cat-shopping", occurredOn: "2026-09-12" }),
  transaction({ amount: 3000, categoryId: "cat-fun", occurredOn: "2026-09-14" }),
  transaction({ amount: 2000, categoryId: "cat-food", occurredOn: "2026-09-16" }),
  transaction({ amount: 200000, categoryId: "cat-housing", occurredOn: "2026-08-15" }),
  transaction({ amount: 400000, type: "income", occurredOn: "2026-08-01" }),
];

function build(transactions: readonly Transaction[] = TRANSACTIONS) {
  return buildInsights({ transactions, categories: CATEGORIES }, PERIOD);
}

describe("buildInsights", () => {
  it("summarizes the month and compares it with the previous month", () => {
    const insights = build();

    expect(insights.summary).toEqual({
      income: 500000,
      expense: 147000,
      balance: 353000,
    });
    expect(insights.previousSummary).toEqual({
      income: 400000,
      expense: 200000,
      balance: 200000,
    });
    expect(insights.monthLabel).toBe("September 2026");
    expect(insights.previousMonthName).toBe("August");
    expect(insights.transactionCount).toBe(8);
  });

  it("computes the average daily spend and savings rate", () => {
    const insights = build();

    expect(insights.averageDailySpend).toBe(
      Math.round(147000 / daysInMonth(2026, 9)),
    );
    expect(insights.savingsRatePercent).toBe(71);
  });

  it("reports month-over-month changes as signed percentages", () => {
    const insights = build();

    expect(insights.incomeChangePercent).toBe(25);
    expect(insights.expenseChangePercent).toBe(-26);
  });

  it("returns null changes when the previous month had nothing to compare", () => {
    const insights = build([
      transaction({ amount: 10000, occurredOn: "2026-09-05" }),
    ]);

    expect(insights.incomeChangePercent).toBeNull();
    expect(insights.expenseChangePercent).toBeNull();
  });

  it("ranks the top spending categories with their share", () => {
    const insights = build();

    expect(insights.topCategories.map((row) => row.categoryId)).toEqual([
      "cat-housing",
      "cat-food",
      "cat-transport",
      "cat-shopping",
    ]);
    expect(insights.topCategories[0]).toEqual({
      categoryId: "cat-housing",
      categoryName: "Housing",
      categoryColor: "#d97706",
      amount: 115000,
      sharePercent: 78,
    });
  });

  it("caps the top categories at the page limit", () => {
    const many = Array.from({ length: 6 }, (_, index) =>
      transaction({
        amount: (index + 1) * 1000,
        categoryId: CATEGORIES[index + 1]!.id,
        occurredOn: `2026-09-0${index + 1}`,
      }),
    );

    expect(build(many).topCategories).toHaveLength(INSIGHT_TOP_CATEGORY_LIMIT);
  });

  it("picks the biggest single expense of the month", () => {
    const insights = build();

    expect(insights.biggestExpense).toEqual({
      id: "txn-2026-09-04-115000",
      note: "Rent",
      amount: 115000,
      categoryName: "Housing",
      categoryColor: "#d97706",
      occurredOn: "2026-09-04",
    });
  });

  it("falls back for a missing category and an empty note", () => {
    const insights = build([
      transaction({
        amount: 5000,
        categoryId: "cat-missing",
        occurredOn: "2026-09-05",
      }),
    ]);

    expect(insights.biggestExpense).toMatchObject({
      note: "No note",
      categoryName: "Uncategorized",
      categoryColor: "#94a3b8",
    });
    expect(insights.topCategories[0]).toMatchObject({
      categoryName: "Uncategorized",
      categoryColor: "#94a3b8",
    });
  });

  it("writes notes that explain the month's trends", () => {
    const insights = build();

    expect(insights.notes).toEqual([
      "You spent 26% less in September than in August.",
      "Housing is your biggest spending category at 78% of September expenses.",
      "Saving 71% of what you earn keeps you ahead of your budget.",
      "Rent was your biggest single expense this month.",
    ]);
  });

  it("explains an increase and a zero-income month", () => {
    const insights = build([
      transaction({ amount: 300000, occurredOn: "2026-09-05" }),
      transaction({ amount: 100000, occurredOn: "2026-08-05" }),
    ]);

    expect(insights.savingsRatePercent).toBe(0);
    expect(insights.notes).toContain(
      "You spent 200% more in September than in August.",
    );
    expect(
      insights.notes.some((note) => note.includes("spent more than you earned")),
    ).toBe(false);
  });

  it("handles a month with no activity", () => {
    const insights = build([]);

    expect(insights.summary).toEqual({ income: 0, expense: 0, balance: 0 });
    expect(insights.averageDailySpend).toBe(0);
    expect(insights.savingsRatePercent).toBe(0);
    expect(insights.topCategories).toEqual([]);
    expect(insights.biggestExpense).toBeNull();
    expect(insights.notes).toEqual([
      "No activity recorded for September yet — add a transaction to see insights.",
    ]);
  });

  it("ignores transactions outside the selected month", () => {
    const insights = build([
      transaction({ amount: 10000, occurredOn: "2026-07-31" }),
      transaction({ amount: 20000, occurredOn: "2026-10-01" }),
    ]);

    expect(insights.transactionCount).toBe(0);
    expect(insights.summary.expense).toBe(0);
  });
});
