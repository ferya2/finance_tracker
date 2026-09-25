import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { Dashboard } from "./dashboard";
import type { UserData } from "@/lib/supabase/dashboard";

const { mockUseUserData } = vi.hoisted(() => ({
  mockUseUserData: vi.fn(),
}));

vi.mock("@/components/use-user-data", () => ({ useUserData: mockUseUserData }));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const DATA: UserData = {
  transactions: [
    {
      id: "txn-1",
      amount: 240000,
      type: "income",
      categoryId: "cat-salary",
      note: "Monthly salary",
      occurredOn: thisMonth(1),
    },
    {
      id: "txn-2",
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: thisMonth(4),
    },
    {
      id: "txn-3",
      amount: 8635,
      type: "expense",
      categoryId: "cat-food",
      note: "Weekly groceries",
      occurredOn: thisMonth(10),
    },
    {
      id: "txn-4",
      amount: 50000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Last year's rent",
      occurredOn: "2020-08-04",
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
      month: thisMonthKey(),
      limitAmount: 130000,
    },
    {
      id: "budget-food",
      categoryId: "cat-food",
      month: thisMonthKey(),
      limitAmount: 5000,
    },
    {
      id: "budget-stale",
      categoryId: "cat-housing",
      month: "2020-08",
      limitAmount: 130000,
    },
  ],
};

/**
 * The dashboard scopes its widgets to the current month, so fixtures are built
 * from the clock to stay correct whenever the suite runs.
 */
function thisMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function thisMonth(day: number): string {
  return `${thisMonthKey()}-${String(day).padStart(2, "0")}`;
}

function readyState(data: UserData) {
  return { status: "ready" as const, data, error: null, reload: vi.fn() };
}

beforeEach(() => {
  stubMatchMedia(true);
  mockUseUserData.mockReset();
  mockUseUserData.mockReturnValue(readyState(DATA));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Dashboard", () => {
  it("shows summary cards computed from the user's data", () => {
    render(<Dashboard />);

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("$663.65")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("$2,400.00")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("$1,236.35")).toBeInTheDocument();
  });

  it("renders the user's transactions newest first with signed amounts", () => {
    render(<Dashboard />);

    const list = screen.getByText("Recent transactions").closest("section");
    const rows = within(list as HTMLElement).getAllByRole("listitem");

    expect(within(rows[0] as HTMLElement).getByText("Weekly groceries")).toBeInTheDocument();
    expect(within(rows[0] as HTMLElement).getByText("−$86.35")).toBeInTheDocument();
    expect(within(rows[0] as HTMLElement).getByText("Food & dining")).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText("Rent")).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText("−$1,150.00")).toBeInTheDocument();
    expect(within(rows[2] as HTMLElement).getByText("Monthly salary")).toBeInTheDocument();
    expect(within(rows[2] as HTMLElement).getByText("+$2,400.00")).toBeInTheDocument();
  });

  it("breaks the current month's spending down by category with shares", () => {
    render(<Dashboard />);

    const breakdown = within(
      screen.getByText("Spending by category").closest("section") as HTMLElement,
    );
    expect(breakdown.getByText("Housing")).toBeInTheDocument();
    expect(breakdown.getByText("93%")).toBeInTheDocument();
    expect(breakdown.getByText("Food & dining")).toBeInTheDocument();
    expect(breakdown.getByText("7%")).toBeInTheDocument();
  });

  it("shows budget progress for the current month and flags over-budget ones", () => {
    render(<Dashboard />);

    const budgets = within(
      screen.getByText("Monthly budgets").closest("section") as HTMLElement,
    );
    expect(budgets.getByText("88% used")).toBeInTheDocument();
    expect(budgets.getByText("Over budget")).toBeInTheDocument();
  });

  it("places every widget in an empty state when the user has no data", () => {
    mockUseUserData.mockReturnValue(
      readyState({ transactions: [], categories: [], budgets: [] }),
    );

    render(<Dashboard />);

    expect(screen.getAllByText("$0.00")).toHaveLength(3);
    expect(screen.getByText("No transactions yet — add one to see it here.")).toBeInTheDocument();
    expect(
      screen.getByText("No spending recorded for this month yet."),
    ).toBeInTheDocument();
    expect(screen.getByText(/No budgets set for/)).toBeInTheDocument();
  });

  it("shows a placeholder while the data is loading", () => {
    mockUseUserData.mockReturnValue({
      status: "loading",
      data: null,
      error: null,
      reload: vi.fn(),
    });

    render(<Dashboard />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.queryByText("Monthly budgets")).not.toBeInTheDocument();
    expect(screen.getByText("This month")).toBeInTheDocument();
  });

  it("shows the failure with a retry that reloads the data", async () => {
    const reload = vi.fn();
    mockUseUserData.mockReturnValue({
      status: "error",
      data: null,
      error: { message: "Failed to fetch transactions" } as unknown as PostgrestError,
      reload,
    });

    render(<Dashboard />);

    expect(
      screen.getByText("Could not load your dashboard"),
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch transactions")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledOnce();
  });
});
