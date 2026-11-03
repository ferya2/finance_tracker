import { describe, expect, it } from "vitest";
import { accountBalance, accountBalances } from "./accounts";
import type { Transaction } from "@/types/transaction";

function transaction(
  amount: number,
  type: Transaction["type"],
): Pick<Transaction, "amount" | "type"> {
  return { amount, type };
}

describe("accountBalance", () => {
  it("returns the opening balance when there are no transactions", () => {
    expect(accountBalance({ openingBalance: 125000 }, [])).toBe(125000);
  });

  it("adds income and subtracts expenses", () => {
    const transactions = [
      transaction(500000, "income"),
      transaction(120000, "expense"),
      transaction(30000, "expense"),
    ];

    expect(accountBalance({ openingBalance: 100000 }, transactions)).toBe(
      450000,
    );
  });

  it("can go negative when expenses exceed the opening balance", () => {
    expect(
      accountBalance({ openingBalance: 50000 }, [transaction(80000, "expense")]),
    ).toBe(-30000);
  });

  it("handles a zero opening balance", () => {
    expect(
      accountBalance({ openingBalance: 0 }, [transaction(4200, "income")]),
    ).toBe(4200);
  });
});

describe("accountBalances", () => {
  const accounts = [
    { id: "acc-checking", openingBalance: 200000 },
    { id: "acc-cash", openingBalance: 50000 },
    { id: "acc-savings", openingBalance: 1000000 },
  ];

  it("builds a detailed row per account, keeping the given order", () => {
    const result = accountBalances(accounts, {
      "acc-checking": [
        transaction(500000, "income"),
        transaction(120000, "expense"),
      ],
      "acc-cash": [transaction(20000, "expense")],
    });

    expect(result).toEqual([
      {
        accountId: "acc-checking",
        openingBalance: 200000,
        income: 500000,
        expense: 120000,
        balance: 580000,
      },
      {
        accountId: "acc-cash",
        openingBalance: 50000,
        income: 0,
        expense: 20000,
        balance: 30000,
      },
      {
        accountId: "acc-savings",
        openingBalance: 1000000,
        income: 0,
        expense: 0,
        balance: 1000000,
      },
    ]);
  });

  it("treats a missing map entry as no transactions", () => {
    const result = accountBalances([accounts[2]]);

    expect(result).toEqual([
      {
        accountId: "acc-savings",
        openingBalance: 1000000,
        income: 0,
        expense: 0,
        balance: 1000000,
      },
    ]);
  });

  it("returns an empty list for no accounts", () => {
    expect(accountBalances([], {})).toEqual([]);
  });
});
