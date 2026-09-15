import { describe, expect, it } from "vitest";
import type { Transaction } from "@/types/transaction";
import { summarizeMonthly } from "./monthly";

function makeTransaction(
  amount: number,
  type: Transaction["type"],
  occurredOn: string,
): Transaction {
  return { id: "txn", amount, type, categoryId: "cat", occurredOn };
}

describe("summarizeMonthly", () => {
  it("sums income and expense, and balances them, for the requested month", () => {
    const transactions = [
      makeTransaction(250000, "income", "2026-09-05"),
      makeTransaction(115000, "expense", "2026-09-12"),
      makeTransaction(8635, "expense", "2026-09-24"),
    ];
    expect(summarizeMonthly(transactions, 2026, 9)).toEqual({
      income: 250000,
      expense: 123635,
      balance: 126365,
    });
  });

  it("excludes transactions from other months of the same year", () => {
    const transactions = [
      makeTransaction(1000, "income", "2026-08-31"),
      makeTransaction(2000, "income", "2026-09-01"),
      makeTransaction(2000, "expense", "2026-10-01"),
    ];
    expect(summarizeMonthly(transactions, 2026, 9)).toEqual({
      income: 2000,
      expense: 0,
      balance: 2000,
    });
  });

  it("excludes transactions from other years", () => {
    const transactions = [
      makeTransaction(1000, "income", "2025-09-15"),
      makeTransaction(2000, "income", "2026-09-15"),
    ];
    expect(summarizeMonthly(transactions, 2026, 9)).toEqual({
      income: 2000,
      expense: 0,
      balance: 2000,
    });
  });

  it("matches a single-digit month with zero-padding", () => {
    const transactions = [
      makeTransaction(5000, "expense", "2026-01-03"),
      makeTransaction(5000, "expense", "2026-02-03"),
    ];
    expect(summarizeMonthly(transactions, 2026, 1)).toEqual({
      income: 0,
      expense: 5000,
      balance: -5000,
    });
  });

  it("distinguishes single-digit months from their double-digit cousins", () => {
    const transactions = [
      makeTransaction(1000, "expense", "2026-01-20"),
      makeTransaction(1000, "expense", "2026-10-20"),
    ];
    expect(summarizeMonthly(transactions, 2026, 1)).toEqual({
      income: 0,
      expense: 1000,
      balance: -1000,
    });
  });

  it("handles the December/January year boundary", () => {
    const transactions = [
      makeTransaction(1000, "income", "2025-12-31"),
      makeTransaction(2000, "income", "2026-01-01"),
      makeTransaction(2000, "expense", "2026-12-25"),
    ];
    expect(summarizeMonthly(transactions, 2026, 1)).toEqual({
      income: 2000,
      expense: 0,
      balance: 2000,
    });
  });

  it("returns all zeros for an empty list", () => {
    expect(summarizeMonthly([], 2026, 9)).toEqual({
      income: 0,
      expense: 0,
      balance: 0,
    });
  });

  it("returns all zeros when no transaction falls in the month", () => {
    const transactions = [makeTransaction(5000, "expense", "2026-07-04")];
    expect(summarizeMonthly(transactions, 2026, 9)).toEqual({
      income: 0,
      expense: 0,
      balance: 0,
    });
  });

  it("gives a negative balance when expenses exceed income for the month", () => {
    const transactions = [
      makeTransaction(5000, "income", "2026-09-02"),
      makeTransaction(12000, "expense", "2026-09-03"),
    ];
    expect(summarizeMonthly(transactions, 2026, 9)).toEqual({
      income: 5000,
      expense: 12000,
      balance: -7000,
    });
  });

  it("summarizes a single transaction", () => {
    expect(summarizeMonthly([makeTransaction(1234, "expense", "2026-09-09")], 2026, 9)).toEqual({
      income: 0,
      expense: 1234,
      balance: -1234,
    });
  });
});