import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "./default-categories";

describe("DEFAULT_CATEGORIES", () => {
  it("provides a sensible spread across income and expense", () => {
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThanOrEqual(6);
    expect(DEFAULT_CATEGORIES.some((category) => category.kind === "income")).toBe(
      true,
    );
    expect(
      DEFAULT_CATEGORIES.some((category) => category.kind === "expense"),
    ).toBe(true);
  });

  it("has unique names", () => {
    const names = DEFAULT_CATEGORIES.map((category) => category.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("uses a valid hex color for every category", () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(category.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});