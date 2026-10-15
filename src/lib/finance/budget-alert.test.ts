import { describe, expect, it } from "vitest";
import type { BudgetSummaryRow } from "./budget-summary";
import { budgetAlertMessage, budgetAlerts } from "./budget-alert";

function makeRow(
  categoryId: string,
  limit: number,
  spent: number,
  categoryName = categoryId,
): BudgetSummaryRow {
  return {
    id: `${categoryId}-2026-09`,
    categoryId,
    categoryName,
    categoryColor: "#000000",
    limit,
    spent,
    remaining: limit - spent,
    percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
    overBudget: spent > 0 && spent > limit,
  };
}

describe("budgetAlerts", () => {
  it("returns nothing when every budget is comfortable", () => {
    expect(
      budgetAlerts([makeRow("housing", 130000, 11500), makeRow("food", 35000, 0)]),
    ).toEqual([]);
  });

  it("flags an over-budget row as over with the amount over the limit", () => {
    expect(budgetAlerts([makeRow("food", 35000, 38240, "Food & dining")])).toEqual([
      {
        id: "food-2026-09",
        categoryName: "Food & dining",
        level: "over",
        percent: 109,
        amount: 3240,
      },
    ]);
  });

  it("flags a row at or past the warning mark as a warning with its headroom", () => {
    expect(budgetAlerts([makeRow("housing", 130000, 115000, "Housing")])).toEqual([
      {
        id: "housing-2026-09",
        categoryName: "Housing",
        level: "warning",
        percent: 88,
        amount: 15000,
      },
    ]);
  });

  it("treats exactly the warning percent as a warning", () => {
    expect(budgetAlerts([makeRow("food", 10000, 8000)])[0].level).toBe("warning");
  });

  it("stays silent just below the warning mark", () => {
    expect(budgetAlerts([makeRow("food", 10000, 7900)])).toEqual([]);
  });

  it("orders over-budget rows before warnings, each worst first", () => {
    const rows = [
      makeRow("transport", 25000, 23000),
      makeRow("food", 35000, 50000),
      makeRow("housing", 130000, 115000),
      makeRow("shopping", 40000, 41000),
    ];

    expect(budgetAlerts(rows).map((alert) => alert.id)).toEqual([
      "food-2026-09",
      "shopping-2026-09",
      "transport-2026-09",
      "housing-2026-09",
    ]);
  });

  it("flags a zero limit that has been spent from as over budget", () => {
    const [alert] = budgetAlerts([makeRow("misc", 0, 500)]);

    expect(alert).toMatchObject({ level: "over", percent: 0, amount: 500 });
  });

  it("does not mutate the rows it is given", () => {
    const rows = [makeRow("food", 35000, 38240)];

    budgetAlerts(rows);

    expect(rows[0]).toEqual(makeRow("food", 35000, 38240));
  });
});

describe("budgetAlertMessage", () => {
  it("returns null when there is nothing to say", () => {
    expect(budgetAlertMessage([])).toBeNull();
  });

  it("names a lone over-budget budget and how much it is over", () => {
    const alerts = budgetAlerts([makeRow("food", 35000, 38240, "Food & dining")]);

    expect(budgetAlertMessage(alerts)).toBe(
      "Food & dining is over budget by $32.40",
    );
  });

  it("names a lone warning and how much of its limit is used", () => {
    const alerts = budgetAlerts([makeRow("housing", 130000, 115000, "Housing")]);

    expect(budgetAlertMessage(alerts)).toBe(
      "Housing is close to its limit (88% used)",
    );
  });

  it("counts several over-budget budgets", () => {
    const alerts = budgetAlerts([
      makeRow("food", 35000, 50000),
      makeRow("shopping", 40000, 41000),
    ]);

    expect(budgetAlertMessage(alerts)).toBe("Budget alert: 2 over budget");
  });

  it("counts a mix of over-budget and near-limit budgets", () => {
    const alerts = budgetAlerts([
      makeRow("food", 35000, 50000),
      makeRow("housing", 130000, 115000),
      makeRow("transport", 25000, 22000),
    ]);

    expect(budgetAlertMessage(alerts)).toBe(
      "Budget alert: 1 over budget · 2 near the limit",
    );
  });

  it("counts several near-limit budgets", () => {
    const alerts = budgetAlerts([
      makeRow("housing", 130000, 115000),
      makeRow("transport", 25000, 22000),
    ]);

    expect(budgetAlertMessage(alerts)).toBe("Budget alert: 2 near the limit");
  });
});
