import { describe, expect, it } from "vitest";
import {
  describeDeletedTransaction,
  describeTransaction,
  restorableToNewTransaction,
  toRestorableTransaction,
  UNDO_WINDOW_MS,
} from "./transaction-delete";
import type { Transaction } from "@/types/transaction";

const TRANSACTION: Transaction = {
  id: "txn-1",
  amount: 115000,
  type: "expense",
  categoryId: "cat-housing",
  note: "Rent",
  occurredOn: "2026-10-02",
};

/** The same transaction, saved without a note at all. */
const BARE: Transaction = {
  id: "txn-2",
  amount: 4500,
  type: "income",
  categoryId: "cat-salary",
  occurredOn: "2026-10-06",
};

describe("toRestorableTransaction", () => {
  it("keeps every field needed to write the transaction back", () => {
    expect(toRestorableTransaction(TRANSACTION)).toEqual({
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: "2026-10-02",
    });
  });

  it("drops the id, which the database assigns on insert", () => {
    expect(toRestorableTransaction(TRANSACTION)).not.toHaveProperty("id");
  });

  it("keeps a transaction that has no note", () => {
    expect(toRestorableTransaction(BARE)).toEqual({
      amount: 4500,
      type: "income",
      categoryId: "cat-salary",
      occurredOn: "2026-10-06",
    });
    expect(toRestorableTransaction(BARE)).not.toHaveProperty("note");
  });

  it("does not carry the snapshot out of the transaction it came from", () => {
    const snapshot = toRestorableTransaction(TRANSACTION);
    snapshot.amount = 1;
    expect(TRANSACTION.amount).toBe(115000);
  });
});

describe("restorableToNewTransaction", () => {
  it("produces the shape the create query accepts", () => {
    expect(restorableToNewTransaction(toRestorableTransaction(TRANSACTION))).toEqual({
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: "2026-10-02",
    });
  });

  it("round-trips a snapshot back into an identical transaction body", () => {
    const restored = restorableToNewTransaction(toRestorableTransaction(TRANSACTION));
    expect({ ...TRANSACTION, ...restored }).toEqual(TRANSACTION);
  });

  it("returns a copy so the snackbar cannot be edited by the caller", () => {
    const snapshot = toRestorableTransaction(TRANSACTION);
    const restored = restorableToNewTransaction(snapshot);
    restored.note = "Changed";
    expect(snapshot.note).toBe("Rent");
  });
});

describe("describeTransaction", () => {
  it("names the transaction and signs an expense with a minus", () => {
    expect(describeTransaction(toRestorableTransaction(TRANSACTION))).toBe(
      '"Rent" · −$1,150.00',
    );
  });

  it("signs income with a plus", () => {
    expect(describeTransaction(toRestorableTransaction(BARE))).toBe(
      '"Transaction" · +$45.00',
    );
  });

  it("falls back to a neutral name when the transaction has no note", () => {
    expect(describeTransaction({ ...BARE, note: "   " })).toBe(
      '"Transaction" · +$45.00',
    );
  });

  it("formats the amount in the requested currency", () => {
    expect(describeTransaction(toRestorableTransaction(TRANSACTION), "EUR")).toContain(
      "€",
    );
  });
});

describe("describeDeletedTransaction", () => {
  it("says what was removed", () => {
    expect(describeDeletedTransaction(toRestorableTransaction(TRANSACTION))).toBe(
      'Deleted "Rent" · −$1,150.00',
    );
  });

  it("describes the transaction the same way for any type", () => {
    expect(describeDeletedTransaction(toRestorableTransaction(BARE))).toBe(
      `Deleted ${describeTransaction(toRestorableTransaction(BARE))}`,
    );
  });
});

describe("UNDO_WINDOW_MS", () => {
  it("is a usable snackbar window", () => {
    expect(Number.isFinite(UNDO_WINDOW_MS)).toBe(true);
    expect(UNDO_WINDOW_MS).toBeGreaterThan(1_000);
    expect(UNDO_WINDOW_MS).toBeLessThanOrEqual(30_000);
  });
});
