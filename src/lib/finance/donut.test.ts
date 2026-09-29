import { describe, expect, it } from "vitest";
import {
  buildDonutBreakdown,
  MAX_DONUT_SLICES,
  OTHER_SLICE_KEY,
  type DonutSourceRow,
} from "./donut";

function row(
  categoryId: string,
  amount: number,
  overrides: Partial<DonutSourceRow> = {},
): DonutSourceRow {
  return {
    categoryId,
    categoryName: categoryId,
    categoryColor: "#059669",
    amount,
    ...overrides,
  };
}

const ROWS: DonutSourceRow[] = [
  row("housing", 115000, { categoryName: "Housing", categoryColor: "#d97706" }),
  row("food", 8635, { categoryName: "Food & dining", categoryColor: "#e11d48" }),
];

describe("buildDonutBreakdown", () => {
  it("returns an empty breakdown when there is nothing to chart", () => {
    expect(buildDonutBreakdown([])).toEqual({ total: 0, slices: [] });
  });

  it("keeps every row, biggest first, with its name and color", () => {
    const { slices } = buildDonutBreakdown(ROWS);

    expect(slices).toEqual([
      {
        key: "housing",
        label: "Housing",
        color: "#d97706",
        amount: 115000,
        percent: 93,
      },
      {
        key: "food",
        label: "Food & dining",
        color: "#e11d48",
        amount: 8635,
        percent: 7,
      },
    ]);
  });

  it("sorts rows that arrive out of order and keeps ties in their given order", () => {
    const { slices } = buildDonutBreakdown([
      row("food", 500, { categoryName: "Food" }),
      row("housing", 500, { categoryName: "Housing" }),
      row("travel", 900, { categoryName: "Travel" }),
    ]);

    expect(slices.map((slice) => slice.label)).toEqual([
      "Travel",
      "Food",
      "Housing",
    ]);
  });

  it("reports the total everything the slices cover", () => {
    expect(buildDonutBreakdown(ROWS).total).toBe(123635);
  });

  it("gives a single category the whole ring", () => {
    const { total, slices } = buildDonutBreakdown([row("housing", 50000)]);

    expect(total).toBe(50000);
    expect(slices).toHaveLength(1);
    expect(slices[0]?.percent).toBe(100);
  });

  it("drops categories with no spending and their total", () => {
    const { total, slices } = buildDonutBreakdown([
      row("housing", 10000),
      row("food", 0),
      row("travel", -2500, { categoryName: "Refunds" }),
    ]);

    expect(total).toBe(10000);
    expect(slices.map((slice) => slice.key)).toEqual(["housing"]);
  });

  it("merges everything past the cap into a single Other slice", () => {
    const many = Array.from({ length: MAX_DONUT_SLICES + 3 }, (_, index) =>
      row(`cat-${index}`, 1000 * (MAX_DONUT_SLICES + 3 - index)),
    );

    const { total, slices } = buildDonutBreakdown(many);

    expect(slices).toHaveLength(MAX_DONUT_SLICES + 1);
    expect(slices.at(-1)).toEqual({
      key: OTHER_SLICE_KEY,
      label: "Other",
      color: "#94a3b8",
      amount: 3000 + 2000 + 1000,
      percent: Math.round((6000 / total) * 100),
    });
    expect(total).toBe(
      slices.reduce((sum, slice) => sum + slice.amount, 0),
    );
  });

  it("keeps every row when the count is exactly the cap", () => {
    const rows = Array.from({ length: MAX_DONUT_SLICES }, (_, index) =>
      row(`cat-${index}`, 100 * (index + 1)),
    );

    const { slices } = buildDonutBreakdown(rows);

    expect(slices).toHaveLength(MAX_DONUT_SLICES);
    expect(slices.some((slice) => slice.key === OTHER_SLICE_KEY)).toBe(false);
  });

  it("honours a custom cap", () => {
    const { slices } = buildDonutBreakdown(
      [row("a", 300), row("b", 200), row("c", 100)],
      2,
    );

    expect(slices.map((slice) => slice.key)).toEqual([
      "a",
      "b",
      OTHER_SLICE_KEY,
    ]);
    expect(slices.at(-1)?.amount).toBe(100);
  });

  it("always keeps at least one slice", () => {
    const { slices } = buildDonutBreakdown([row("a", 300), row("b", 200)], 0);

    expect(slices.map((slice) => slice.key)).toEqual(["a", OTHER_SLICE_KEY]);
  });

  it("does not mutate the source rows", () => {
    const rows = [row("food", 10), row("housing", 20)];
    buildDonutBreakdown(rows);

    expect(rows.map((entry) => entry.categoryId)).toEqual(["food", "housing"]);
  });
});
