import { describe, expect, it } from "vitest";
import { buildSummaryCards, percentChange } from "./summary";
import type { Transaction } from "@/types/transaction";

const PERIOD = { year: 2026, month: 9 };

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
  transaction({ amount: 240000, type: "income", occurredOn: "2026-09-01" }),
  transaction({ amount: 115000, categoryId: "cat-housing", occurredOn: "2026-09-04" }),
  transaction({ amount: 8635, occurredOn: "2026-09-10" }),
  transaction({ amount: 200000, type: "income", occurredOn: "2026-08-01" }),
  transaction({ amount: 100000, categoryId: "cat-housing", occurredOn: "2026-08-04" }),
  transaction({ amount: 5000, occurredOn: "2026-07-28" }),
];

function build(transactions: readonly Transaction[] = TRANSACTIONS) {
  return buildSummaryCards(transactions, PERIOD);
}

describe("percentChange", () => {
  it("reports an increase as a positive percentage", () => {
    expect(percentChange(120, 100)).toBe(20);
  });

  it("reports a decrease as a negative percentage", () => {
    expect(percentChange(80, 100)).toBe(-20);
  });

  it("reports an unchanged amount as zero", () => {
    expect(percentChange(500, 500)).toBe(0);
  });

  it("rounds to a whole percent", () => {
    expect(percentChange(123635, 115000)).toBe(8);
    expect(percentChange(115000, 123635)).toBe(-7);
  });

  it("returns null when there is no previous amount to compare against", () => {
    expect(percentChange(500, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
  });
});

describe("buildSummaryCards", () => {
  it("returns balance, income and expense in that order", () => {
    expect(build().map((card) => card.key)).toEqual([
      "balance",
      "income",
      "expense",
    ]);
  });

  it("balances every transaction but scopes income and expense to the month", () => {
    const [balanceCard, incomeCard, expenseCard] = build();

    expect(balanceCard).toMatchObject({
      label: "Balance",
      amount: 240000 + 200000 - (115000 + 8635 + 100000 + 5000),
      caption: "All time",
      trend: null,
    });
    expect(incomeCard).toMatchObject({
      label: "Income",
      amount: 240000,
      caption: "September",
    });
    expect(expenseCard).toMatchObject({
      label: "Expense",
      amount: 123635,
      caption: "September",
    });
  });

  it("compares the month against the previous month", () => {
    const [, incomeCard, expenseCard] = build();

    expect(incomeCard?.trend).toEqual({
      direction: "up",
      percent: 20,
      previousMonthName: "August",
    });
    expect(expenseCard?.trend).toEqual({
      direction: "up",
      percent: 24,
      previousMonthName: "August",
    });
  });

  it("flags a drop and a level amount as down and flat", () => {
    const [, incomeCard] = build([
      transaction({ amount: 200000, type: "income", occurredOn: "2026-09-01" }),
      transaction({ amount: 400000, type: "income", occurredOn: "2026-08-01" }),
    ]);

    expect(incomeCard?.trend).toMatchObject({ direction: "down", percent: -50 });

    const [, flatIncome] = build([
      transaction({ amount: 50000, type: "income", occurredOn: "2026-09-01" }),
      transaction({ amount: 50000, type: "income", occurredOn: "2026-08-01" }),
    ]);

    expect(flatIncome?.trend).toMatchObject({ direction: "flat", percent: 0 });
  });

  it("leaves out the trend when the previous month had nothing recorded", () => {
    const [, incomeCard, expenseCard] = build([
      transaction({ amount: 240000, type: "income", occurredOn: "2026-09-01" }),
      transaction({ amount: 8635, occurredOn: "2026-09-10" }),
    ]);

    expect(incomeCard?.trend).toBeNull();
    expect(expenseCard?.trend).toBeNull();
  });

  it("still computes trends across the year boundary", () => {
    const cards = buildSummaryCards(
      [
        transaction({ amount: 300000, type: "income", occurredOn: "2026-01-05" }),
        transaction({ amount: 200000, type: "income", occurredOn: "2025-12-05" }),
      ],
      { year: 2026, month: 1 },
    );

    expect(cards[1]).toMatchObject({
      amount: 300000,
      caption: "January",
      trend: { direction: "up", percent: 50, previousMonthName: "December" },
    });
  });

  it("returns zeroed cards for a brand new user", () => {
    const cards = build([]);

    expect(cards).toEqual([
      { key: "balance", label: "Balance", amount: 0, caption: "All time", trend: null },
      { key: "income", label: "Income", amount: 0, caption: "September", trend: null },
      { key: "expense", label: "Expense", amount: 0, caption: "September", trend: null },
    ]);
  });

  it("handles a negative balance", () => {
    const [balanceCard] = build([
      transaction({ amount: 500, occurredOn: "2026-09-02" }),
    ]);

    expect(balanceCard?.amount).toBe(-500);
  });

  it("does not mutate the source transactions", () => {
    const order = TRANSACTIONS.map((txn) => txn.id);
    build();
    expect(TRANSACTIONS.map((txn) => txn.id)).toEqual(order);
  });
});
