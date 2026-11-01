import { describe, expect, it } from "vitest";
import type { Category } from "@/types/category";
import type {
  NewRecurringTransaction,
  RecurrenceFrequency,
  RecurringTransaction,
} from "@/types/recurring";
import {
  buildRecurringList,
  describeFrequency,
  emptyRecurringForm,
  isRecurringTransaction,
  recurringToFormValues,
  sanitizeRecurringTransactions,
  toNewRecurring,
  validateRecurringForm,
  validateRecurringInput,
} from "./recurring-form";

const valid: NewRecurringTransaction = {
  amount: 2500,
  type: "expense",
  categoryId: "cat-food",
  note: "Weekly shop",
  startOn: "2026-09-01",
  frequency: "weekly",
  interval: 1,
};

const saved: RecurringTransaction = {
  ...valid,
  id: "rec-1",
};

const CATEGORIES: Category[] = [
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
];

describe("emptyRecurringForm", () => {
  it("starts on the reference day as a monthly expense", () => {
    expect(emptyRecurringForm("2026-09-12")).toEqual({
      type: "expense",
      amount: "",
      categoryId: "",
      note: "",
      startOn: "2026-09-12",
      frequency: "monthly",
      interval: "1",
      endOn: "",
    });
  });
});

describe("recurringToFormValues", () => {
  it("prefills every field from a saved recurring transaction", () => {
    expect(recurringToFormValues(saved)).toEqual({
      type: "expense",
      amount: "25",
      categoryId: "cat-food",
      note: "Weekly shop",
      startOn: "2026-09-01",
      frequency: "weekly",
      interval: "1",
      endOn: "",
    });
  });

  it("leaves a missing note and end date blank", () => {
    const withoutNote: RecurringTransaction = {
      id: saved.id,
      amount: saved.amount,
      type: saved.type,
      categoryId: saved.categoryId,
      startOn: saved.startOn,
      frequency: saved.frequency,
      interval: saved.interval,
    };
    expect(recurringToFormValues(withoutNote).note).toBe("");
    expect(recurringToFormValues(withoutNote).endOn).toBe("");
  });
});

describe("toNewRecurring", () => {
  it("parses the amount and interval, trims text and keeps a note", () => {
    expect(
      toNewRecurring({
        type: "income",
        amount: " 1,234.56 ",
        categoryId: " cat-salary ",
        note: "  Paycheck  ",
        startOn: " 2026-09-01 ",
        frequency: "yearly",
        interval: " 2 ",
        endOn: " 2027-09-01 ",
      }),
    ).toEqual({
      amount: 123456,
      type: "income",
      categoryId: "cat-salary",
      note: "Paycheck",
      startOn: "2026-09-01",
      frequency: "yearly",
      interval: 2,
      endOn: "2027-09-01",
    });
  });

  it("drops an empty note and end date", () => {
    const result = toNewRecurring({
      ...emptyRecurringForm("2026-09-01"),
      amount: "10",
      categoryId: "cat-food",
      note: "   ",
      endOn: "  ",
    });

    expect(result.note).toBeUndefined();
    expect(result.endOn).toBeUndefined();
  });

  it("falls back to an invalid amount and interval so validation catches them", () => {
    const result = toNewRecurring({
      ...emptyRecurringForm("2026-09-01"),
      amount: "not money",
      interval: "",
    });

    expect(result.amount).toBe(0);
    expect(result.interval).toBe(0);
  });
});

describe("validateRecurringInput", () => {
  it("returns no errors for a valid recurring transaction", () => {
    expect(validateRecurringInput(valid)).toEqual({});
  });

  it("accepts an end date on or after the start date", () => {
    expect(validateRecurringInput({ ...valid, endOn: "2026-09-01" })).toEqual({});
    expect(validateRecurringInput({ ...valid, endOn: "2026-12-01" })).toEqual({});
    expect(validateRecurringInput({ ...valid, endOn: null })).toEqual({});
  });

  it("reuses the transaction rules for amount, type, category and note", () => {
    expect(validateRecurringInput({ ...valid, amount: 0 }).amount).toBe(
      "Amount must be a positive whole number of cents.",
    );
    expect(
      validateRecurringInput({
        ...valid,
        type: "credit",
      } as unknown as NewRecurringTransaction).type,
    ).toBe('Type must be "income" or "expense".');
    expect(validateRecurringInput({ ...valid, categoryId: " " }).categoryId).toBe(
      "Category is required.",
    );
    expect(validateRecurringInput({ ...valid, note: "x".repeat(201) }).note).toBe(
      "Note must be at most 200 characters.",
    );
  });

  it("rejects an invalid start date", () => {
    expect(validateRecurringInput({ ...valid, startOn: "2026-02-30" }).startOn).toBe(
      "Start date must be a valid YYYY-MM-DD date.",
    );
    expect(validateRecurringInput({ ...valid, startOn: "09/01/2026" }).startOn).toBe(
      "Start date must be a valid YYYY-MM-DD date.",
    );
  });

  it("rejects an unknown frequency", () => {
    expect(
      validateRecurringInput({
        ...valid,
        frequency: "hourly",
      } as unknown as NewRecurringTransaction).frequency,
    ).toBe("Frequency must be daily, weekly, monthly or yearly.");
  });

  it("rejects a zero, negative or fractional interval", () => {
    expect(validateRecurringInput({ ...valid, interval: 0 }).interval).toBe(
      "Interval must be a whole number of at least 1.",
    );
    expect(validateRecurringInput({ ...valid, interval: -2 }).interval).toBe(
      "Interval must be a whole number of at least 1.",
    );
    expect(validateRecurringInput({ ...valid, interval: 1.5 }).interval).toBe(
      "Interval must be a whole number of at least 1.",
    );
    expect(validateRecurringInput({ ...valid, interval: Number.NaN }).interval).toBe(
      "Interval must be a whole number of at least 1.",
    );
  });

  it("rejects an invalid end date and one before the start", () => {
    expect(validateRecurringInput({ ...valid, endOn: "nope" }).endOn).toBe(
      "End date must be a valid YYYY-MM-DD date.",
    );
    expect(validateRecurringInput({ ...valid, endOn: "2026-08-31" }).endOn).toBe(
      "End date cannot be before the start date.",
    );
  });

  it("collects several field errors at once", () => {
    expect(
      validateRecurringInput({
        amount: 0,
        type: "credit",
        categoryId: "",
        startOn: "",
        frequency: "hourly",
        interval: 0,
        endOn: "nope",
      } as unknown as NewRecurringTransaction),
    ).toEqual({
      amount: "Amount must be a positive whole number of cents.",
      type: 'Type must be "income" or "expense".',
      categoryId: "Category is required.",
      startOn: "Start date must be a valid YYYY-MM-DD date.",
      frequency: "Frequency must be daily, weekly, monthly or yearly.",
      interval: "Interval must be a whole number of at least 1.",
      endOn: "End date must be a valid YYYY-MM-DD date.",
    });
  });
});

describe("validateRecurringForm", () => {
  it("validates the form values after parsing them", () => {
    expect(
      validateRecurringForm({
        type: "expense",
        amount: "25.00",
        categoryId: "cat-food",
        note: "",
        startOn: "2026-09-01",
        frequency: "weekly",
        interval: "1",
        endOn: "",
      }),
    ).toEqual({});
  });

  it("reports an unparseable amount", () => {
    expect(
      validateRecurringForm({
        ...emptyRecurringForm("2026-09-01"),
        categoryId: "cat-food",
      }).amount,
    ).toBe("Amount must be a positive whole number of cents.");
  });
});

describe("describeFrequency", () => {
  it("labels single intervals without a number", () => {
    expect(describeFrequency("daily", 1)).toBe("Every day");
    expect(describeFrequency("weekly", 1)).toBe("Every week");
    expect(describeFrequency("monthly", 1)).toBe("Every month");
    expect(describeFrequency("yearly", 1)).toBe("Every year");
  });

  it("pluralises multi-unit intervals", () => {
    expect(describeFrequency("daily", 3)).toBe("Every 3 days");
    expect(describeFrequency("weekly", 2)).toBe("Every 2 weeks");
    expect(describeFrequency("monthly", 6)).toBe("Every 6 months");
    expect(describeFrequency("yearly", 4)).toBe("Every 4 years");
  });

  it("floors a fractional interval and treats bad input as one", () => {
    expect(describeFrequency("weekly", 2.9)).toBe("Every 2 weeks");
    expect(describeFrequency("weekly", 0)).toBe("Every week");
    expect(describeFrequency("weekly", Number.NaN)).toBe("Every week");
  });

  it("falls back for an unknown frequency", () => {
    expect(
      describeFrequency("hourly" as unknown as RecurrenceFrequency, 1),
    ).toBe("Custom schedule");
  });
});

describe("buildRecurringList", () => {
  it("resolves category details and the next occurrence", () => {
    const [row] = buildRecurringList([saved], CATEGORIES, "2026-09-01");

    expect(row).toMatchObject({
      id: "rec-1",
      amount: 2500,
      type: "expense",
      note: "Weekly shop",
      categoryName: "Food & dining",
      categoryColor: "#e11d48",
      scheduleLabel: "Every week",
      nextOn: "2026-09-08",
      ended: false,
    });
  });

  it("falls back for an unknown category and a missing note", () => {
    const withoutNote: RecurringTransaction = {
      id: saved.id,
      amount: saved.amount,
      type: saved.type,
      categoryId: "gone",
      startOn: saved.startOn,
      frequency: saved.frequency,
      interval: saved.interval,
    };
    const [row] = buildRecurringList(
      [withoutNote],
      CATEGORIES,
      "2026-09-01",
    );

    expect(row.categoryName).toBe("Uncategorized");
    expect(row.categoryColor).toBe("#71717a");
    expect(row.note).toBe("Recurring transaction");
  });

  it("marks an ended schedule and sorts it after active ones", () => {
    const ended: RecurringTransaction = {
      ...saved,
      id: "rec-ended",
      note: "Ended plan",
      endOn: "2026-09-02",
    };
    const later: RecurringTransaction = {
      ...saved,
      id: "rec-later",
      note: "Later plan",
      startOn: "2026-10-01",
    };

    const rows = buildRecurringList([ended, later], CATEGORIES, "2026-09-03");

    expect(rows.map((row) => row.id)).toEqual(["rec-later", "rec-ended"]);
    expect(rows[1]).toMatchObject({ nextOn: null, ended: true });
  });

  it("sorts ended entries by note when there is no next date", () => {
    const a: RecurringTransaction = {
      ...saved,
      id: "rec-a",
      note: "A plan",
      endOn: "2026-09-01",
    };
    const b: RecurringTransaction = {
      ...saved,
      id: "rec-b",
      note: "B plan",
      endOn: "2026-09-01",
    };

    expect(
      buildRecurringList([b, a], CATEGORIES, "2026-09-02").map((row) => row.id),
    ).toEqual(["rec-a", "rec-b"]);
  });
});

describe("isRecurringTransaction", () => {
  it("accepts a complete valid entry", () => {
    expect(isRecurringTransaction(saved)).toBe(true);
  });

  it("rejects non-objects, missing ids and invalid fields", () => {
    expect(isRecurringTransaction(null)).toBe(false);
    expect(isRecurringTransaction("rec-1")).toBe(false);
    expect(isRecurringTransaction({ ...saved, id: "" })).toBe(false);
    expect(isRecurringTransaction({ ...saved, amount: 0 })).toBe(false);
    expect(isRecurringTransaction({ ...saved, note: 42 })).toBe(false);
    expect(isRecurringTransaction({ ...saved, endOn: 42 })).toBe(false);
  });
});

describe("sanitizeRecurringTransactions", () => {
  it("keeps valid entries and drops invalid or duplicate ones", () => {
    const result = sanitizeRecurringTransactions([
      saved,
      { ...saved, id: "rec-2", note: "Another" },
      { ...saved, id: "rec-1", note: "Duplicate id" },
      { ...saved, id: "" },
      { nope: true },
      "not a recurring entry",
    ]);

    expect(result.map((entry) => entry.id)).toEqual(["rec-1", "rec-2"]);
  });

  it("returns nothing for a value that is not an array", () => {
    expect(sanitizeRecurringTransactions(null)).toEqual([]);
    expect(sanitizeRecurringTransactions({})).toEqual([]);
  });
});
