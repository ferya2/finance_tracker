import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YearlyReportView } from "./yearly-report-view";
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

const NOW = new Date();
const YEAR = NOW.getFullYear();
const PREVIOUS_YEAR = YEAR - 1;

const DATA: UserData = {
  transactions: [
    {
      id: "this-income",
      amount: 500000,
      type: "income",
      categoryId: "cat-salary",
      note: "Monthly salary",
      occurredOn: `${YEAR}-01-01`,
    },
    {
      id: "this-expense",
      amount: 100000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: `${YEAR}-01-04`,
    },
    {
      id: "last-income",
      amount: 300000,
      type: "income",
      categoryId: "cat-salary",
      note: "Monthly salary",
      occurredOn: `${PREVIOUS_YEAR}-02-01`,
    },
    {
      id: "last-expense",
      amount: 20000,
      type: "expense",
      categoryId: "cat-food",
      note: "Groceries",
      occurredOn: `${PREVIOUS_YEAR}-02-15`,
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
  return screen.getByText(label).closest("article") as HTMLElement;
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

describe("YearlyReportView", () => {
  it("shows the current year's headline totals", () => {
    render(<YearlyReportView />);

    expect(
      screen.getByRole("heading", { name: "Yearly overview" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(String(YEAR)).length).toBeGreaterThan(0);

    expect(within(card("Total income")).getByText("$5,000.00")).toBeInTheDocument();
    expect(within(card("Total expenses")).getByText("$1,000.00")).toBeInTheDocument();
    expect(within(card("Net balance")).getByText("$4,000.00")).toBeInTheDocument();
    expect(
      within(card("Avg monthly expense")).getByText("$83.33"),
    ).toBeInTheDocument();
  });

  it("renders the 12-month summary and the year's category shares", () => {
    render(<YearlyReportView />);

    const summary = screen
      .getByRole("heading", { name: "12-month summary" })
      .closest("section") as HTMLElement;
    expect(within(summary).getByText("January")).toBeInTheDocument();
    expect(within(summary).getByText("December")).toBeInTheDocument();
    expect(within(summary).getByText("Total")).toBeInTheDocument();

    const categories = screen
      .getByRole("heading", { name: "Spending by category" })
      .closest("section") as HTMLElement;
    expect(within(categories).getByText("Housing")).toBeInTheDocument();
  });

  it("steps back to the previous year's overview", async () => {
    const user = userEvent.setup();
    render(<YearlyReportView />);

    await user.click(screen.getByRole("button", { name: "Previous year" }));

    expect(screen.getAllByText(String(PREVIOUS_YEAR)).length).toBeGreaterThan(0);
    expect(
      within(card("Total income")).getByText("$3,000.00"),
    ).toBeInTheDocument();
    expect(
      within(card("Total expenses")).getByText("$200.00"),
    ).toBeInTheDocument();

    const categories = screen
      .getByRole("heading", { name: "Spending by category" })
      .closest("section") as HTMLElement;
    expect(within(categories).getByText("Food & dining")).toBeInTheDocument();
  });

  it("does not allow navigating past the current year", () => {
    render(<YearlyReportView />);

    expect(screen.getByRole("button", { name: "Next year" })).toBeDisabled();
  });
});
