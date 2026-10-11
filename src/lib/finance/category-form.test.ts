import { describe, expect, it } from "vitest";
import {
  CATEGORY_COLOR_PALETTE,
  categoryToFormValues,
  emptyCategoryForm,
  isValidCategoryColor,
  MAX_CATEGORY_NAME_LENGTH,
  toNewCategory,
  validateCategoryForm,
  type CategoryFormValues,
} from "./category-form";
import type { Category } from "@/types/category";

const EXPENSE: Category = {
  id: "cat-food",
  name: "Food & dining",
  color: "#e11d48",
  kind: "expense",
};

const valid: CategoryFormValues = {
  name: "Groceries",
  kind: "expense",
  color: "#059669",
};

describe("emptyCategoryForm", () => {
  it("starts as a blank expense on the first palette colour", () => {
    expect(emptyCategoryForm()).toEqual({
      name: "",
      kind: "expense",
      color: CATEGORY_COLOR_PALETTE[0],
    });
  });

  it("accepts a starting colour", () => {
    expect(emptyCategoryForm("#2563eb").color).toBe("#2563eb");
  });
});

describe("categoryToFormValues", () => {
  it("copies the saved category's fields", () => {
    expect(categoryToFormValues(EXPENSE)).toEqual({
      name: "Food & dining",
      kind: "expense",
      color: "#e11d48",
    });
  });
});

describe("isValidCategoryColor", () => {
  it("accepts a six-digit hex colour in either case", () => {
    expect(isValidCategoryColor("#059669")).toBe(true);
    expect(isValidCategoryColor("#ABCDEF")).toBe(true);
  });

  it("rejects anything that is not a six-digit hex colour", () => {
    expect(isValidCategoryColor("red")).toBe(false);
    expect(isValidCategoryColor("#fff")).toBe(false);
    expect(isValidCategoryColor("#0596699")).toBe(false);
    expect(isValidCategoryColor("")).toBe(false);
  });
});

describe("toNewCategory", () => {
  it("trims the name and keeps the kind and colour", () => {
    expect(toNewCategory({ ...valid, name: "  Groceries  " })).toEqual({
      name: "Groceries",
      kind: "expense",
      color: "#059669",
    });
  });
});

describe("validateCategoryForm", () => {
  it("accepts a valid form", () => {
    expect(validateCategoryForm(valid)).toEqual({});
  });

  it("requires a name", () => {
    expect(validateCategoryForm({ ...valid, name: "   " })).toHaveProperty(
      "name",
      "Name is required.",
    );
  });

  it("caps the name length", () => {
    const long = "a".repeat(MAX_CATEGORY_NAME_LENGTH + 1);
    expect(validateCategoryForm({ ...valid, name: long })).toHaveProperty(
      "name",
      `Name must be at most ${MAX_CATEGORY_NAME_LENGTH} characters.`,
    );
  });

  it("accepts a name exactly at the limit", () => {
    const exact = "a".repeat(MAX_CATEGORY_NAME_LENGTH);
    expect(validateCategoryForm({ ...valid, name: exact })).toEqual({});
  });

  it("rejects an unknown kind", () => {
    const bad = { ...valid, kind: "transfer" } as unknown as CategoryFormValues;
    expect(validateCategoryForm(bad)).toHaveProperty(
      "kind",
      'Kind must be "income" or "expense".',
    );
  });

  it("rejects an invalid colour", () => {
    expect(validateCategoryForm({ ...valid, color: "blue" })).toHaveProperty(
      "color",
      "Choose a valid colour.",
    );
  });
});
