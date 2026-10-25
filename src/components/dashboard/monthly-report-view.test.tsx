import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthlyReportView } from "./monthly-report-view";
import type { UserData } from "@/lib/supabase/dashboard";
import {
  currentPeriod,
  formatMonthLabel,
  formatMonthName,
  previousPeriod,
} from "@/lib/finance/period";

const { mockUseUserData } = vi.hoisted(() => ({ mockUseUserData: vi.fn() }));

vi.mock("@/components/use-user-data", () => ({ useUserData: mockUseUserData }));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const NOW = new Date();
const PERIOD = currentPeriod(NOW);
const PREVIOUS = previousPeriod(PERIOD);

function keyOf(period: { year: number; month: number }): string {
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

function dayIn(period: { year: number; month: number }, day: number): string {
  return `${keyOf(period)}-${String(day).padStart(2, "0")}`;
}

const DATA: UserData = {
  transactions: [
    {
      id: "txn-salary",
      amount: 500000,
      type: "income",
      categoryId: "cat-salary",
      note: "Monthly salary",
      occurredOn: dayIn(PERIOD, 1),
    },
    {
      id: "txn-rent",
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: dayIn(PERIOD, 4),
    },
    {
      id: "txn-groceries",
      amount: 15000,
      type: "expense",
      categoryId: "cat-food",
      note: "Groceries",
      occurredOn: dayIn(PERIOD, 5),
    },
    {
      id: "txn-last-month",
      amount: 20000,
      type: "expense",
      categoryId: "cat-food",
      note: "Last month groceries",
      occurredOn: dayIn(PREVIOUS, 15),
    },
  ],
  categories: [
    { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
    { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
    { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  ],
  budgets: [
    {
      id: "budget-housing",
      categoryId: "cat-housing",
      month: keyOf(PERIOD),
      limitAmount: 130000,
    },
  ],
};

beforeEach(() => {
  stubMatchMedia(true);
  mockUseUserData.mockReset();
  mockUseUserData.mockReturnValue({
    status: "ready",
    data: DATA,
    error: null,
    reload: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MonthlyReportView", () => {
  it("shows the current month's headline figures", () => {
    render(<MonthlyReportView />);

    expect(
      screen.getByRole("heading", { name: "Monthly report" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(formatMonthLabel(PERIOD.year, PERIOD.month)).length,
    ).toBeGreaterThan(0);

    const cards = screen.getByText("Net").closest("div.grid") as HTMLElement;
    expect(within(cards).getByText("$3,700.00")).toBeInTheDocument();
    expect(within(cards).getByText("$5,000.00")).toBeInTheDocument();
    expect(within(cards).getByText("$1,300.00")).toBeInTheDocument();
    expect(
      within(cards).getByText(
        `550% vs ${formatMonthName(PREVIOUS.year, PREVIOUS.month)}`,
      ),
    ).toBeInTheDocument();
  });

  it("composes the daily trend, category breakdown and budgets", () => {
    render(<MonthlyReportView />);

    const daily = screen
      .getByRole("heading", { name: "Spending by day" })
      .closest("section") as HTMLElement;
    expect(within(daily).getByText("Transactions")).toBeInTheDocument();
    expect(within(daily).getByText("3")).toBeInTheDocument();

    const categories = screen
      .getByRole("heading", { name: "Where it went" })
      .closest("section") as HTMLElement;
    expect(within(categories).getByText("Housing")).toBeInTheDocument();
    expect(
      within(categories).getByText(
        `spent in ${formatMonthName(PERIOD.year, PERIOD.month)}`,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Monthly budgets" }),
    ).toBeInTheDocument();
  });

  it("steps back to the previous month's report", async () => {
    const user = userEvent.setup();
    render(<MonthlyReportView />);

    await user.click(screen.getByRole("button", { name: "Previous month" }));

    expect(
      screen.getAllByText(formatMonthLabel(PREVIOUS.year, PREVIOUS.month)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText(formatMonthLabel(PERIOD.year, PERIOD.month)),
    ).not.toBeInTheDocument();

    const cards = screen.getByText("Net").closest("div.grid") as HTMLElement;
    expect(within(cards).getByText("$200.00")).toBeInTheDocument();
  });

  it("does not allow navigating past the current month", () => {
    render(<MonthlyReportView />);

    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });
});
