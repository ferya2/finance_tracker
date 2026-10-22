import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpendingTrend } from "./spending-trend";
import type { Transaction } from "@/types/transaction";

/**
 * A `YYYY-MM-DD` date a number of days from today (0 = today, -1 = yesterday),
 * derived from the clock so the trend window always covers the transactions.
 */
function isoDaysFromToday(days: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** The axis label the trend gives a day, e.g. "21 Oct". */
function dayLabel(days: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${date.getDate()} ${month}`;
}

const TRANSACTIONS: Transaction[] = [  {
    id: "txn-1",
    amount: 1200,
    type: "expense",
    categoryId: "cat-food",
    note: "Groceries",
    occurredOn: isoDaysFromToday(0),
  },
  {
    id: "txn-2",
    amount: 4500,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: isoDaysFromToday(-1),
  },
  {
    id: "txn-3",
    amount: 500000,
    type: "income",
    categoryId: "cat-salary",
    note: "Salary",
    occurredOn: isoDaysFromToday(-2),
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

describe("SpendingTrend", () => {
  it("shows the spending of the last 30 days", () => {
    render(<SpendingTrend transactions={TRANSACTIONS} />);

    expect(
      screen.getByRole("heading", { name: "Spending over time" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(screen.getByText("Spent")).toBeInTheDocument();
    expect(screen.getByText("$57.00")).toBeInTheDocument();
  });

  it("leaves income out of the spending line", () => {
    render(<SpendingTrend transactions={TRANSACTIONS} />);

    expect(screen.queryByText("$5,000.00")).not.toBeInTheDocument();
  });

  it("switches the range to weeks and months", async () => {
    const user = userEvent.setup();
    render(<SpendingTrend transactions={TRANSACTIONS} />);

    await user.click(screen.getByRole("button", { name: "Week" }));
    expect(screen.getByText("Last 12 weeks")).toBeInTheDocument();
    expect(screen.getByText("Average per week")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Month" }));
    expect(screen.getByText("Last 12 months")).toBeInTheDocument();
    expect(screen.getByText("Average per month")).toBeInTheDocument();
  });

  it("names the biggest bucket of the period", () => {
    render(<SpendingTrend transactions={TRANSACTIONS} />);

    expect(screen.getByText("Biggest day")).toBeInTheDocument();
    expect(
      screen.getByText(`$45.00 · ${dayLabel(-1)}`),
    ).toBeInTheDocument();
  });

  it("shows a placeholder while the transactions are loading", () => {
    render(<SpendingTrend transactions={[]} loading />);

    expect(
      screen.getByRole("status", { name: "Loading spending trend" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Spent")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing was spent", () => {
    render(<SpendingTrend transactions={[]} />);

    expect(
      screen.getByText("No spending recorded in this period yet."),
    ).toBeInTheDocument();
  });
});
