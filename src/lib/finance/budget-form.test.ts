import { describe, expect, it } from "vitest";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import {
  budgetToFormValues,
  budgetableCategories,
  buildMonthOptions,
  emptyBudgetForm,
  toBudgetUpdate,
  toNewBudget,
  validateBudgetForm,
  type BudgetFormValues,
} from "./budget-form";

const BUDGET: Budget = {
  id: "bud-1",
  categoryId: "cat-food",
  month: "2026-10",
  limitAmount: 50000,
};

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
];

const VALID: BudgetFormValues = {
  categoryId: "cat-food",
  month: "2026-10",
  limitAmount: "500.00",
};

describe("emptyBudgetForm", () => {
  it("prefills the given month and leaves other fields blank", () => {
    expect(emptyBudgetForm("2026-10")).toEqual({
      categoryId: "",
      month: "2026-10",
      limitAmount: "",
    });
  });

  it("returns a fresh object each time", () => {
    const a = emptyBudgetForm("2026-10");
    const b = emptyBudgetForm("2026-10");
    a.limitAmount = "100";
    expect(b.limitAmount).toBe("");
  });
});

describe("budgetToFormValues", () => {
  it("prefills every field from a saved budget", () => {
    expect(budgetToFormValues(BUDGET)).toEqual({
      categoryId: "cat-food",
      month: "2026-10",
      limitAmount: "500",
    });
  });

  it("formats cents as an editable decimal", () => {
    expect(
      budgetToFormValues({ ...BUDGET, limitAmount: 240000 }).limitAmount,
    ).toBe("2400");
    expect(budgetToFormValues({ ...BUDGET, limitAmount: 8635 }).limitAmount).toBe(
      "86.35",
    );
  });
});

describe("toNewBudget", () => {
  it("parses the typed limit into integer cents", () => {
    expect(toNewBudget(VALID)).toEqual({
      categoryId: "cat-food",
      month: "2026-10",
      limitAmount: 50000,
    });
  });

  it("accepts currency symbols and thousand separators", () => {
    expect(toNewBudget({ ...VALID, limitAmount: "$1,500.00" }).limitAmount).toBe(
      150000,
    );
  });

  it("trims text fields", () => {
    expect(
      toNewBudget({
        categoryId: "  cat-food  ",
        month: " 2026-10 ",
        limitAmount: "500.00",
      }),
    ).toEqual({
      categoryId: "cat-food",
      month: "2026-10",
      limitAmount: 50000,
    });
  });

  it("falls back to zero for an unparseable limit", () => {
    expect(toNewBudget({ ...VALID, limitAmount: "" }).limitAmount).toBe(0);
    expect(toNewBudget({ ...VALID, limitAmount: "abc" }).limitAmount).toBe(0);
  });
});

describe("toBudgetUpdate", () => {
  it("returns the same shape as toNewBudget", () => {
    expect(toBudgetUpdate(VALID)).toEqual(toNewBudget(VALID));
  });
});

describe("validateBudgetForm", () => {
  it("accepts a valid form", () => {
    expect(validateBudgetForm(VALID)).toEqual({});
  });

  it("rejects a missing category", () => {
    expect(
      validateBudgetForm({ ...VALID, categoryId: "" }).categoryId,
    ).toBe("Category is required.");
    expect(
      validateBudgetForm({ ...VALID, categoryId: "   " }).categoryId,
    ).toBe("Category is required.");
  });

  it("rejects a missing month", () => {
    expect(validateBudgetForm({ ...VALID, month: "" }).month).toBe(
      "Month is required.",
    );
  });

  it("rejects an invalid month format", () => {
    expect(validateBudgetForm({ ...VALID, month: "10/2026" }).month).toBe(
      "Month must be in YYYY-MM format.",
    );
    expect(validateBudgetForm({ ...VALID, month: "2026-13" }).month).toBe(
      "Month must be a valid calendar month.",
    );
    expect(validateBudgetForm({ ...VALID, month: "2026-00" }).month).toBe(
      "Month must be a valid calendar month.",
    );
  });

  it("rejects a zero or negative limit", () => {
    expect(validateBudgetForm({ ...VALID, limitAmount: "0" }).limitAmount).toBe(
      "Amount must be greater than zero.",
    );
    expect(validateBudgetForm({ ...VALID, limitAmount: "-10" }).limitAmount).toBe(
      "Amount must be greater than zero.",
    );
  });

  it("rejects an unparseable limit", () => {
    expect(validateBudgetForm({ ...VALID, limitAmount: "abc" }).limitAmount).toBe(
      "Amount must be a positive whole number of cents.",
    );
    expect(validateBudgetForm({ ...VALID, limitAmount: "10.555" }).limitAmount).toBe(
      "Amount must be a positive whole number of cents.",
    );
  });
});

describe("budgetableCategories", () => {
  it("returns only expense categories", () => {
    expect(budgetableCategories(CATEGORIES).map((c) => c.id)).toEqual([
      "cat-food",
      "cat-housing",
    ]);
  });

  it("returns an empty array when there are no expense categories", () => {
    expect(
      budgetableCategories([{ id: "s", name: "Salary", color: "#000", kind: "income" }]),
    ).toEqual([]);
  });
});

describe("buildMonthOptions", () => {
  it("builds options starting from the base month", () => {
    expect(buildMonthOptions(2026, 10, 3)).toEqual([
      { value: "2026-10", label: "October 2026" },
      { value: "2026-11", label: "November 2026" },
      { value: "2026-12", label: "December 2026" },
    ]);
  });

  it("rolls over the year boundary", () => {
    expect(buildMonthOptions(2026, 11, 3)).toEqual([
      { value: "2026-11", label: "November 2026" },
      { value: "2026-12", label: "December 2026" },
      { value: "2027-01", label: "January 2027" },
    ]);
  });

  it("defaults to twelve months", () => {
    expect(buildMonthOptions(2026, 1)).toHaveLength(12);
    expect(buildMonthOptions(2026, 1).at(-1)?.value).toBe("2026-12");
  });
});
