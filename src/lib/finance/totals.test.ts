import { describe, expect, it } from "vitest";
import type { Transaction } from "@/types/transaction";
import { balance, sumExpense, sumIncome } from "./totals";

function makeTransaction(
  amount: number,
  type: Transaction["type"],
): Transaction {
  return { id: "txn", amount, type, categoryId: "cat", occurredOn: "2026-09-12" };
}

const income = [250000, 125000, 3000].map((amount) =>
  makeTransaction(amount, "income"),
);
const expense = [115000, 8635, 2450, 5990].map((amount) =>
  makeTransaction(amount, "expense"),
);

describe("sumIncome", () => {
  it("sums all income amounts in cents", () => {
    expect(sumIncome(income)).toBe(378000);
  });

  it("returns 0 for an empty list", () => {
    expect(sumIncome([])).toBe(0);
  });

  it("ignores expense transactions", () => {
    expect(sumIncome(expense)).toBe(0);
  });

  it("sums a single transaction", () => {
    expect(sumIncome([makeTransaction(100, "income")])).toBe(100);
  });
});

describe("sumExpense", () => {
  it("sums all expense amounts in cents", () => {
    expect(sumExpense(expense)).toBe(132075);
  });

  it("returns 0 for an empty list", () => {
    expect(sumExpense([])).toBe(0);
  });

  it("ignores income transactions", () => {
    expect(sumExpense(income)).toBe(0);
  });

  it("sums a single transaction", () => {
    expect(sumExpense([makeTransaction(100, "expense")])).toBe(100);
  });
});

describe("balance", () => {
  it("is income minus expense for a mixed list", () => {
    expect(balance([...income, ...expense])).toBe(245925);
  });

  it("is positive income minus expense", () => {
    expect(balance([makeTransaction(50000, "income")])).toBe(50000);
  });

  it("is negative when expenses exceed income", () => {
    const transactions = [
      makeTransaction(5000, "income"),
      makeTransaction(12000, "expense"),
    ];
    expect(balance(transactions)).toBe(-7000);
  });

  it("returns 0 for an empty list", () => {
    expect(balance([])).toBe(0);
  });
});