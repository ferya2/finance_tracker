import { describe, expect, it } from "vitest";
import {
  categoriesForType,
  emptyTransactionForm,
  toNewTransaction,
  validateTransactionForm,
  type TransactionFormValues,
} from "./transaction-form";
import { MAX_NOTE_LENGTH } from "./transaction";
import type { Category } from "@/types/category";

const VALUES: TransactionFormValues = {
  type: "expense",
  amount: "1234.56",
  categoryId: "cat-food",
  note: "Weekly groceries",
  occurredOn: "2026-10-02",
};

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-freelance", name: "Freelance", color: "#0d9488", kind: "income" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
];

describe("emptyTransactionForm", () => {
  it("starts a blank expense dated on the reference day", () => {
    expect(emptyTransactionForm("2026-10-02")).toEqual({
      type: "expense",
      amount: "",
      categoryId: "",
      note: "",
      occurredOn: "2026-10-02",
    });
  });

  it("returns a fresh object each time so forms cannot share state", () => {
    const first = emptyTransactionForm("2026-10-02");
    const second = emptyTransactionForm("2026-10-02");

    first.amount = "500";

    expect(second.amount).toBe("");
  });
});

describe("toNewTransaction", () => {
  it("parses the typed amount into integer cents", () => {
    expect(toNewTransaction(VALUES)).toEqual({
      amount: 123456,
      type: "expense",
      categoryId: "cat-food",
      note: "Weekly groceries",
      occurredOn: "2026-10-02",
    });
  });

  it("accepts a currency symbol and thousand separators", () => {
    expect(toNewTransaction({ ...VALUES, amount: "$1,234.56" }).amount).toBe(123456);
  });

  it("trims the note and the other text fields", () => {
    const transaction = toNewTransaction({
      ...VALUES,
      note: "  Weekly groceries  ",
      categoryId: "  cat-food  ",
      occurredOn: " 2026-10-02 ",
    });

    expect(transaction.note).toBe("Weekly groceries");
    expect(transaction.categoryId).toBe("cat-food");
    expect(transaction.occurredOn).toBe("2026-10-02");
  });

  it("drops a blank note instead of saving an empty string", () => {
    expect(toNewTransaction({ ...VALUES, note: "   " })).not.toHaveProperty("note");
  });

  it("falls back to zero cents for an amount that cannot be parsed", () => {
    expect(toNewTransaction({ ...VALUES, amount: "" }).amount).toBe(0);
    expect(toNewTransaction({ ...VALUES, amount: "abc" }).amount).toBe(0);
  });

  it("keeps a negative amount negative so validation can reject it", () => {
    expect(toNewTransaction({ ...VALUES, amount: "-12.34" }).amount).toBe(-1234);
  });
});

describe("validateTransactionForm", () => {
  it("accepts a complete form", () => {
    expect(validateTransactionForm(VALUES)).toEqual({});
  });

  it("reports every empty required field of a blank form", () => {
    const errors = validateTransactionForm(emptyTransactionForm("2026-10-02"));

    expect(errors).toEqual({
      amount: "Amount must be a positive whole number of cents.",
      categoryId: "Category is required.",
    });
  });

  it("reports an unparseable amount", () => {
    expect(validateTransactionForm({ ...VALUES, amount: "ten" }).amount).toBe(
      "Amount must be a positive whole number of cents.",
    );
  });

  it("reports a zero or negative amount", () => {
    expect(validateTransactionForm({ ...VALUES, amount: "0" }).amount).toBe(
      "Amount must be a positive whole number of cents.",
    );
    expect(validateTransactionForm({ ...VALUES, amount: "-5" }).amount).toBe(
      "Amount must be a positive whole number of cents.",
    );
  });

  it("reports a missing category even when it is only whitespace", () => {
    expect(validateTransactionForm({ ...VALUES, categoryId: "   " }).categoryId).toBe(
      "Category is required.",
    );
  });

  it("reports an impossible date", () => {
    expect(validateTransactionForm({ ...VALUES, occurredOn: "2026-02-31" }).occurredOn).toBe(
      "Occurred on must be a valid YYYY-MM-DD date.",
    );
  });

  it("reports a note longer than the limit, trimmed or not", () => {
    const long = "x".repeat(MAX_NOTE_LENGTH + 1);

    expect(validateTransactionForm({ ...VALUES, note: long }).note).toBe(
      `Note must be at most ${MAX_NOTE_LENGTH} characters.`,
    );
    expect(validateTransactionForm({ ...VALUES, note: `  ${long}  ` }).note).toBe(
      `Note must be at most ${MAX_NOTE_LENGTH} characters.`,
    );
  });

  it("accepts a note of exactly the maximum length", () => {
    expect(
      validateTransactionForm({ ...VALUES, note: "x".repeat(MAX_NOTE_LENGTH) }),
    ).toEqual({});
  });

  it("reports a blank date", () => {
    expect(validateTransactionForm({ ...VALUES, occurredOn: "" }).occurredOn).toBe(
      "Occurred on must be a valid YYYY-MM-DD date.",
    );
  });
});

describe("categoriesForType", () => {
  it("keeps only the categories of that kind, in their original order", () => {
    expect(categoriesForType(CATEGORIES, "expense").map((c) => c.id)).toEqual([
      "cat-food",
      "cat-housing",
    ]);
    expect(categoriesForType(CATEGORIES, "income").map((c) => c.id)).toEqual([
      "cat-salary",
      "cat-freelance",
    ]);
  });

  it("falls back to every category when none match the type", () => {
    const incomeOnly = CATEGORIES.filter((category) => category.kind === "income");

    expect(categoriesForType(incomeOnly, "expense")).toEqual(incomeOnly);
  });

  it("returns an empty list when the user has no categories at all", () => {
    expect(categoriesForType([], "expense")).toEqual([]);
  });

  it("does not mutate the categories it was given", () => {
    const source = [...CATEGORIES];

    categoriesForType(source, "expense");

    expect(source).toEqual(CATEGORIES);
  });
});