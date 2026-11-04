import { describe, expect, it } from "vitest";
import type { Account } from "@/types/account";
import type { Transfer } from "@/types/transfer";
import {
  applyTransfersToBalances,
  buildTransferRows,
  transferEffect,
} from "./transfer";

const TRANSFERS: Transfer[] = [
  {
    id: "tr-1",
    fromAccountId: "acc-checking",
    toAccountId: "acc-savings",
    amount: 50000,
    note: "Monthly saving",
    occurredOn: "2026-09-01",
  },
  {
    id: "tr-2",
    fromAccountId: "acc-savings",
    toAccountId: "acc-cash",
    amount: 12500,
    occurredOn: "2026-09-03",
  },
];

const ACCOUNTS: Account[] = [
  {
    id: "acc-checking",
    name: "Everyday checking",
    kind: "checking",
    openingBalance: 200000,
    color: "#059669",
  },
  {
    id: "acc-savings",
    name: "Savings",
    kind: "savings",
    openingBalance: 1000000,
    color: "#2563eb",
  },
  {
    id: "acc-cash",
    name: "Cash",
    kind: "cash",
    openingBalance: 50000,
    color: "#d97706",
  },
];

describe("transferEffect", () => {
  it("sums money moving in and out of an account", () => {
    expect(transferEffect(TRANSFERS, "acc-savings")).toEqual({
      accountId: "acc-savings",
      incoming: 50000,
      outgoing: 12500,
      net: 37500,
    });
  });

  it("returns zero for an account with no transfers", () => {
    expect(transferEffect(TRANSFERS, "acc-other")).toEqual({
      accountId: "acc-other",
      incoming: 0,
      outgoing: 0,
      net: 0,
    });
  });

  it("handles an empty transfer list", () => {
    expect(transferEffect([], "acc-checking").net).toBe(0);
  });
});

describe("applyTransfersToBalances", () => {
  it("adjusts each balance by its net transfers", () => {
    const balances = [
      { accountId: "acc-checking", balance: 200000 },
      { accountId: "acc-savings", balance: 1000000 },
      { accountId: "acc-cash", balance: 50000 },
    ];

    expect(applyTransfersToBalances(balances, TRANSFERS)).toEqual([
      { accountId: "acc-checking", balance: 150000 },
      { accountId: "acc-savings", balance: 1037500 },
      { accountId: "acc-cash", balance: 62500 },
    ]);
  });

  it("keeps the original row when nothing moves", () => {
    const row = { accountId: "acc-other", balance: 1000 };
    const result = applyTransfersToBalances([row], TRANSFERS);

    expect(result[0]).toBe(row);
  });

  it("returns an empty list for no balances", () => {
    expect(applyTransfersToBalances([], TRANSFERS)).toEqual([]);
  });
});

describe("buildTransferRows", () => {
  it("resolves account names and orders newest first", () => {
    const rows = buildTransferRows(TRANSFERS, ACCOUNTS);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: "tr-2",
      fromName: "Savings",
      toName: "Cash",
      note: "Transfer",
      fromColor: "#2563eb",
      toColor: "#d97706",
    });
    expect(rows[1]).toMatchObject({
      id: "tr-1",
      fromName: "Everyday checking",
      toName: "Savings",
      note: "Monthly saving",
    });
  });

  it("falls back for an account that no longer exists", () => {
    const rows = buildTransferRows(
      [
        {
          id: "tr-3",
          fromAccountId: "acc-gone",
          toAccountId: "acc-cash",
          amount: 100,
          occurredOn: "2026-09-05",
        },
      ],
      ACCOUNTS,
    );

    expect(rows[0].fromName).toBe("Deleted account");
    expect(rows[0].fromColor).toBe("#71717a");
  });

  it("returns an empty list when there are no transfers", () => {
    expect(buildTransferRows([], ACCOUNTS)).toEqual([]);
  });
});
