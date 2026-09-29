import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { BudgetProgress } from "./budget-progress";
import type { DashboardBudgetRow } from "@/lib/finance/dashboard";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

/** A budget row exactly as `buildDashboardData` derives it from real data. */
function row(
  id: string,
  categoryName: string,
  limit: number,
  spent: number,
): DashboardBudgetRow {
  return {
    id,
    categoryId: `cat-${id}`,
    categoryName,
    categoryColor: "#059669",
    limit,
    spent,
    remaining: limit - spent,
    percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
    overBudget: spent > 0 && spent > limit,
  };
}

const HOUSING = row("housing", "Housing", 130000, 115000);
const FOOD = row("food", "Food & dining", 5000, 8635);
const COFFEE = row("coffee", "Coffee", 10000, 9000);
const ROWS = [HOUSING, FOOD];

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BudgetProgress", () => {
  it("totals the month's budgets above the per-category rows", () => {
    render(<BudgetProgress rows={ROWS} monthName="September" />);

    expect(screen.getByText("$1,236.35")).toBeInTheDocument();
    expect(screen.getByText("spent of $1,350.00")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 over budget")).toBeInTheDocument();
  });

  it("shows how much of the month's limits the gauge covers", () => {
    render(<BudgetProgress rows={ROWS} monthName="September" />);

    expect(screen.getByText("92%")).toBeInTheDocument();
  });

  it("renders a row per budget with its spending, limit and headroom", () => {
    render(<BudgetProgress rows={ROWS} monthName="September" />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(
      "Housing$1,150.00 / $1,300.0088% used · $150.00 left",
    );
    expect(items[1]).toHaveTextContent(
      "Food & dining$86.35 / $50.00Over budget · $36.35 over",
    );
  });

  it("flags a budget that has been exceeded instead of showing headroom", () => {
    render(<BudgetProgress rows={ROWS} monthName="September" />);

    const over = screen.getAllByRole("listitem")[1] as HTMLElement;
    expect(within(over).getByText("Over budget")).toBeInTheDocument();
    expect(within(over).queryByText(/left$/)).not.toBeInTheDocument();
  });

  it("colours each progress bar by how close that budget is to its limit", () => {
    const { container } = render(
      <BudgetProgress
        rows={[row("housing", "Housing", 130000, 50000), FOOD, COFFEE]}
        monthName="September"
      />,
    );

    const bars = [...container.querySelectorAll("li > div > div")];
    expect(bars.map((bar) => bar.className)).toEqual([
      "h-full rounded-full bg-primary",
      "h-full rounded-full bg-danger",
      "h-full rounded-full bg-warning",
    ]);
  });

  it("reports the tracked count when nothing is over budget", () => {
    render(<BudgetProgress rows={[HOUSING]} monthName="September" />);

    expect(screen.getByText("1 tracked this month")).toBeInTheDocument();
  });

  it("falls back to an empty state for a month without budgets", () => {
    render(<BudgetProgress rows={[]} monthName="September" />);

    expect(
      screen.getByText("No budgets set for September yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.queryByText("spent of $0.00")).not.toBeInTheDocument();
  });
});
