import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { PostgrestError } from "@supabase/supabase-js";
import type { UserData } from "@/lib/supabase/dashboard";
import {
  currentPeriod,
  daysInMonth,
  formatMonthLabel,
  formatMonthName,
  previousPeriod,
} from "@/lib/finance/period";
import { formatCurrency } from "@/lib/finance/format";
import { InsightsView } from "./insights-view";

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
const MONTH_NAME = formatMonthName(PERIOD.year, PERIOD.month);
const PREVIOUS_NAME = formatMonthName(PREVIOUS.year, PREVIOUS.month);

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
      id: "txn-last-rent",
      amount: 200000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: dayIn(PREVIOUS, 15),
    },
    {
      id: "txn-last-salary",
      amount: 400000,
      type: "income",
      categoryId: "cat-salary",
      note: "Monthly salary",
      occurredOn: dayIn(PREVIOUS, 1),
    },
  ],
  categories: [
    { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
    { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
    { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  ],
  budgets: [],
};

const EMPTY_DATA: UserData = {
  transactions: [],
  categories: DATA.categories,
  budgets: [],
};

function readyState(data: UserData, reload = vi.fn()) {
  return { status: "ready" as const, data, error: null, reload };
}

beforeEach(() => {
  stubMatchMedia(true);
  mockUseUserData.mockReset();
  mockUseUserData.mockReturnValue(readyState(DATA));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("InsightsView", () => {
  it("renders this month's stat cards from real data", () => {
    render(<InsightsView />);

    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument();
    expect(
      screen.getByText(formatMonthLabel(PERIOD.year, PERIOD.month)),
    ).toBeInTheDocument();
    expect(screen.getByText("Daily average")).toBeInTheDocument();
    expect(
      screen.getByText(
        formatCurrency(
          Math.round(130000 / daysInMonth(PERIOD.year, PERIOD.month)),
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Savings rate")).toBeInTheDocument();
    expect(screen.getByText("74%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
    expect(screen.getByText("−35%")).toBeInTheDocument();
    expect(
      screen.getByText(`Spent less than in ${PREVIOUS_NAME}`),
    ).toBeInTheDocument();
  });

  it("ranks the top spending categories and highlights the biggest expense", () => {
    render(<InsightsView />);

    const top = screen
      .getByText("Top categories")
      .closest("section") as HTMLElement;
    expect(within(top).getByText("Housing")).toBeInTheDocument();
    expect(within(top).getByText("Food & dining")).toBeInTheDocument();

    const biggest = screen
      .getByText("Biggest single expense")
      .closest("div") as HTMLElement;
    expect(within(biggest).getByText("$1,150.00")).toBeInTheDocument();
    expect(within(biggest).getByText("Rent")).toBeInTheDocument();
    expect(screen.getAllByText("$1,150.00")).toHaveLength(2);
  });

  it("writes notes that explain the month's trends", () => {
    render(<InsightsView />);

    expect(screen.getByText("Notes for you")).toBeInTheDocument();
    expect(
      screen.getByText(
        `You spent 35% less in ${MONTH_NAME} than in ${PREVIOUS_NAME}.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Housing is your biggest spending category at 88% of ${MONTH_NAME} expenses.`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Saving 74% of what you earn keeps you ahead of your budget.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rent was your biggest single expense this month."),
    ).toBeInTheDocument();
  });

  it("shows an empty state when the month has no activity", () => {
    mockUseUserData.mockReturnValue(readyState(EMPTY_DATA));

    render(<InsightsView />);

    expect(
      screen.getByText(`No spending recorded for ${MONTH_NAME} yet.`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`No expenses recorded for ${MONTH_NAME} yet.`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `No activity recorded for ${MONTH_NAME} yet — add a transaction to see insights.`,
      ),
    ).toBeInTheDocument();
  });

  it("renders a loading skeleton while data loads", () => {
    mockUseUserData.mockReturnValue({
      status: "loading",
      data: null,
      error: null,
      reload: vi.fn(),
    });

    render(<InsightsView />);

    expect(
      screen.getByRole("status", { name: "Loading insights" }),
    ).toBeInTheDocument();
  });

  it("shows an error with a retry button and reports the failure", () => {
    const reload = vi.fn();
    mockUseUserData.mockReturnValue({
      status: "error",
      data: null,
      error: { message: "Network down" } as unknown as PostgrestError,
      reload,
    });

    render(<InsightsView />);

    expect(screen.getByText("Could not load your insights")).toBeInTheDocument();
    expect(screen.getByText("Network down")).toBeInTheDocument();

    screen.getByRole("button", { name: "Try again" }).click();
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
