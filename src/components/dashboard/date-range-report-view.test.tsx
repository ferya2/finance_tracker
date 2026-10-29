import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { DateRangeReportView } from "./date-range-report-view";
import type { UserData } from "@/lib/supabase/dashboard";

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

/** A `YYYY-MM-DD` date a number of days from today (0 = today). */
function isoDaysFromToday(days: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

const TODAY = isoDaysFromToday(0);

const DATA: UserData = {
  transactions: [
    {
      id: "txn-salary",
      amount: 500000,
      type: "income",
      categoryId: "cat-salary",
      note: "Monthly salary",
      occurredOn: isoDaysFromToday(0),
    },
    {
      id: "txn-rent",
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: isoDaysFromToday(-1),
    },
    {
      id: "txn-groceries",
      amount: 15000,
      type: "expense",
      categoryId: "cat-food",
      note: "Groceries",
      occurredOn: isoDaysFromToday(-3),
    },
    {
      id: "txn-old",
      amount: 20000,
      type: "expense",
      categoryId: "cat-food",
      note: "Old groceries",
      occurredOn: isoDaysFromToday(-60),
    },
  ],
  categories: [
    { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
    { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
    { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  ],
  budgets: [],
};

function card(label: string): HTMLElement {
  return screen.getByText(label).closest("div.rounded-2xl") as HTMLElement;
}

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

describe("DateRangeReportView", () => {
  it("shows the default range's headline figures", () => {
    render(<DateRangeReportView />);

    expect(
      screen.getByRole("heading", { name: "Date-range report" }),
    ).toBeInTheDocument();

    expect(within(card("Net")).getByText("$3,700.00")).toBeInTheDocument();
    expect(within(card("Income")).getByText("$5,000.00")).toBeInTheDocument();
    expect(within(card("Expenses")).getByText("$1,300.00")).toBeInTheDocument();
  });

  it("composes the trend, stats and category shares", () => {
    render(<DateRangeReportView />);

    const trend = screen
      .getByRole("heading", { name: "Spending over time" })
      .closest("section") as HTMLElement;
    expect(within(trend).getByText("Daily")).toBeInTheDocument();
    expect(within(trend).getByText("$43.33")).toBeInTheDocument();
    expect(within(trend).getByText("Transactions")).toBeInTheDocument();

    const categories = screen
      .getByRole("heading", { name: "Where it went" })
      .closest("section") as HTMLElement;
    expect(within(categories).getByText("Housing")).toBeInTheDocument();
    expect(within(categories).getByText("Food & dining")).toBeInTheDocument();
    expect(
      within(categories).getByText("spent in this range"),
    ).toBeInTheDocument();
  });

  it("narrows the report when the start date moves", () => {
    render(<DateRangeReportView />);

    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: TODAY },
    });

    expect(within(card("Net")).getByText("$5,000.00")).toBeInTheDocument();
    expect(within(card("Income")).getByText("$5,000.00")).toBeInTheDocument();
    expect(within(card("Expenses")).getByText("$0.00")).toBeInTheDocument();
    expect(
      screen.getAllByText("No spending recorded in this range yet.").length,
    ).toBeGreaterThan(0);
  });

  it("asks for a valid range when the start is after the end", () => {
    render(<DateRangeReportView />);

    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: isoDaysFromToday(1) },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Pick a start date on or before the end date.",
    );
    expect(
      screen.queryByRole("heading", { name: "Spending over time" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Choose a valid range to see the report."),
    ).toBeInTheDocument();
  });

  it("links to the monthly report", () => {
    render(<DateRangeReportView />);

    expect(screen.getByRole("link", { name: "Monthly report" })).toHaveAttribute(
      "href",
      "/dashboard/reports/monthly",
    );
  });
});
