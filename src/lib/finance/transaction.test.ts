import { describe, expect, it } from "vitest";
import type { NewTransaction } from "@/types/transaction";
import {
  MAX_NOTE_LENGTH,
  isValidTransaction,
  validateTransaction,
} from "./transaction";

const validTransaction: NewTransaction = {
  amount: 2500,
  type: "expense",
  categoryId: "groceries",
  note: "Weekly shop",
  occurredOn: "2026-09-12",
};

describe("validateTransaction", () => {
  it("returns no errors for a valid transaction", () => {
    expect(validateTransaction(validTransaction)).toEqual({});
  });

  it("accepts an expense without a note", () => {
    const { amount, type, categoryId, occurredOn } = validTransaction;
    expect(validateTransaction({ amount, type, categoryId, occurredOn })).toEqual({});
  });

  it("accepts a valid income transaction", () => {
    expect(
      validateTransaction({ ...validTransaction, type: "income" }),
    ).toEqual({});
  });

  it("accepts a single-cent amount", () => {
    expect(validateTransaction({ ...validTransaction, amount: 1 })).toEqual({});
  });

  it("accepts a category id with surrounding whitespace", () => {
    expect(
      validateTransaction({
        ...validTransaction,
        categoryId: "  groceries  ",
      }),
    ).toEqual({});
  });

  it("rejects a zero amount", () => {
    expect(validateTransaction({ ...validTransaction, amount: 0 }).amount).toBe(
      "Amount must be a positive whole number of cents.",
    );
  });

  it("rejects a negative amount", () => {
    expect(
      validateTransaction({ ...validTransaction, amount: -500 }).amount,
    ).toBe("Amount must be a positive whole number of cents.");
  });

  it("rejects a non-integer amount in cents", () => {
    expect(
      validateTransaction({ ...validTransaction, amount: 10.5 }).amount,
    ).toBe("Amount must be a positive whole number of cents.");
  });

  it("rejects a non-number amount", () => {
    const input = {
      ...validTransaction,
      amount: "25.00",
    } as unknown as NewTransaction;
    expect(validateTransaction(input).amount).toBe(
      "Amount must be a positive whole number of cents.",
    );
  });

  it("rejects an unknown transaction type", () => {
    const input = {
      ...validTransaction,
      type: "credit",
    } as unknown as NewTransaction;
    expect(validateTransaction(input).type).toBe(
      'Type must be "income" or "expense".',
    );
  });

  it("rejects a missing transaction type", () => {
    const { amount, categoryId, occurredOn } = validTransaction;
    expect(
      validateTransaction({
        amount,
        categoryId,
        occurredOn,
      } as unknown as NewTransaction).type,
    ).toBe('Type must be "income" or "expense".');
  });

  it("rejects an empty category id", () => {
    expect(
      validateTransaction({ ...validTransaction, categoryId: "" }).categoryId,
    ).toBe("Category is required.");
  });

  it("rejects a whitespace-only category id", () => {
    expect(
      validateTransaction({ ...validTransaction, categoryId: "   " }).categoryId,
    ).toBe("Category is required.");
  });

  it("rejects a missing category id", () => {
    const { amount, type, occurredOn } = validTransaction;
    expect(
      validateTransaction({
        amount,
        type,
        occurredOn,
      } as unknown as NewTransaction).categoryId,
    ).toBe("Category is required.");
  });

  it("rejects a note that is too long", () => {
    const longNote = "x".repeat(MAX_NOTE_LENGTH + 1);
    expect(
      validateTransaction({ ...validTransaction, note: longNote }).note,
    ).toBe(`Note must be at most ${MAX_NOTE_LENGTH} characters.`);
  });

  it("accepts a note of exactly the maximum length", () => {
    const maxNote = "x".repeat(MAX_NOTE_LENGTH);
    expect(
      validateTransaction({ ...validTransaction, note: maxNote }),
    ).toEqual({});
  });

  it("rejects a non-string note", () => {
    const input = {
      ...validTransaction,
      note: 42,
    } as unknown as NewTransaction;
    expect(validateTransaction(input).note).toBe("Note must be a string.");
  });

  it("rejects a malformed date", () => {
    expect(
      validateTransaction({ ...validTransaction, occurredOn: "not-a-date" })
        .occurredOn,
    ).toBe("Occurred on must be a valid YYYY-MM-DD date.");
  });

  it("rejects a date that does not exist", () => {
    expect(
      validateTransaction({ ...validTransaction, occurredOn: "2026-02-30" })
        .occurredOn,
    ).toBe("Occurred on must be a valid YYYY-MM-DD date.");
  });

  it("rejects a month out of range", () => {
    expect(
      validateTransaction({ ...validTransaction, occurredOn: "2026-13-01" })
        .occurredOn,
    ).toBe("Occurred on must be a valid YYYY-MM-DD date.");
  });

  it("rejects a non-zero-padded date", () => {
    expect(
      validateTransaction({ ...validTransaction, occurredOn: "2026-9-2" })
        .occurredOn,
    ).toBe("Occurred on must be a valid YYYY-MM-DD date.");
  });

  it("rejects a missing date", () => {
    const { amount, type, categoryId } = validTransaction;
    expect(
      validateTransaction({
        amount,
        type,
        categoryId,
      } as unknown as NewTransaction).occurredOn,
    ).toBe("Occurred on must be a valid YYYY-MM-DD date.");
  });

  it("collects multiple field errors at once", () => {
    expect(
      validateTransaction({
        amount: -1,
        type: "credit",
        categoryId: "",
        occurredOn: "",
      } as unknown as NewTransaction),
    ).toEqual({
      amount: "Amount must be a positive whole number of cents.",
      type: 'Type must be "income" or "expense".',
      categoryId: "Category is required.",
      occurredOn: "Occurred on must be a valid YYYY-MM-DD date.",
    });
  });
});

describe("isValidTransaction", () => {
  it("is true for a valid transaction", () => {
    expect(isValidTransaction(validTransaction)).toBe(true);
  });

  it("is false when any field is invalid", () => {
    expect(isValidTransaction({ ...validTransaction, amount: 0 })).toBe(false);
  });
});