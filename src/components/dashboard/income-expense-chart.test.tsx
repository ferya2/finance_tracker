import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IncomeExpenseChart } from "./income-expense-chart";
import type { Transaction } from "@/types/transaction";

/** A `YYYY-MM-DD` date a number of days from today (0 = today). */
function isoDaysFromToday(days: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

const TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    amount: 500000,
    type: "income",
    categoryId: "cat-salary",
    note: "Salary",
    occurredOn: isoDaysFromToday(0),
  },
  {
    id: "txn-2",
    amount: 4500,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: isoDaysFromToday(0),
  },
];

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IncomeExpenseChart", () => {
  it("renders grouped income and expense bars with a legend", () => {
    render(<IncomeExpenseChart transactions={TRANSACTIONS} />);

    expect(
      screen.getByRole("heading", { name: "Income vs expenses" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Last 6 months")).toBeInTheDocument();
    expect(screen.getAllByText("Income").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Expenses").length).toBeGreaterThan(0);
  });

  it("exposes every month's income, expense and balance to screen readers", () => {
    render(<IncomeExpenseChart transactions={TRANSACTIONS} />);

    const table = screen.getByRole("table", { hidden: true });
    expect(table).toHaveTextContent(
      "Income vs expenses over the last 6 months",
    );
    expect(table).toHaveTextContent("$5,000.00");
    expect(table).toHaveTextContent("$45.00");
    expect(table).toHaveTextContent("$4,955.00");
  });

  it("shows a placeholder while the transactions are loading", () => {
    render(<IncomeExpenseChart transactions={[]} loading />);

    expect(
      screen.getByRole("status", { name: "Loading income vs expenses" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table", { hidden: true })).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing was recorded", () => {
    render(<IncomeExpenseChart transactions={[]} />);

    expect(
      screen.getByText("No income or expenses recorded in this period yet."),
    ).toBeInTheDocument();
  });
});
