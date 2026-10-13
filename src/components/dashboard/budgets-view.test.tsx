import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { BudgetsView } from "./budgets-view";
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

/**
 * A `YYYY-MM-DD` date in a month offset from today (0 = this month, -1 = last
 * month), pinned to the 15th so it never drifts across a boundary. Deriving the
 * date from the clock keeps the budget status correct whenever the suite runs.
 */
function isoInMonth(monthOffset: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 15);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** The `YYYY-MM` budget key for a month offset from today. */
function monthKeyIn(monthOffset: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const DATA: UserData = {
  transactions: [
    {
      id: "txn-1",
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: isoInMonth(0),
    },
    {
      id: "txn-2",
      amount: 38240,
      type: "expense",
      categoryId: "cat-food",
      note: "Groceries",
      occurredOn: isoInMonth(0),
    },
    {
      id: "txn-3",
      amount: 5000,
      type: "expense",
      categoryId: "cat-food",
      note: "Last month groceries",
      occurredOn: isoInMonth(-1),
    },
  ],
  categories: [
    { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
    { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
    { id: "cat-transport", name: "Transport", color: "#0284c7", kind: "expense" },
  ],
  budgets: [
    {
      id: "budget-housing",
      categoryId: "cat-housing",
      month: monthKeyIn(0),
      limitAmount: 130000,
    },
    {
      id: "budget-food",
      categoryId: "cat-food",
      month: monthKeyIn(0),
      limitAmount: 35000,
    },
    {
      id: "budget-transport",
      categoryId: "cat-transport",
      month: monthKeyIn(0),
      limitAmount: 25000,
    },
    {
      id: "budget-old",
      categoryId: "cat-food",
      month: monthKeyIn(-1),
      limitAmount: 40000,
    },
  ],
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

describe("BudgetsView", () => {
  it("renders this month's budgets with spent and limit", () => {
    render(<BudgetsView />);

    expect(screen.getByRole("heading", { name: "Budgets" })).toBeInTheDocument();
    expect(screen.getByText("3 tracked budgets")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("$1,150.00")).toBeInTheDocument();
    expect(screen.getByText(/1,300\.00/)).toBeInTheDocument();
    expect(screen.getByText("$150.00 left this month")).toBeInTheDocument();
  });

  it("flags over-budget categories and counts those needing attention", () => {
    render(<BudgetsView />);

    expect(screen.getAllByText("Over budget")).toHaveLength(1);
    expect(screen.getByText("Over by $32.40")).toBeInTheDocument();
    expect(screen.getByText("1 need attention")).toBeInTheDocument();
  });

  it("shows a category with no spending this month as zero", () => {
    render(<BudgetsView />);

    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText("$250.00 left this month")).toBeInTheDocument();
  });

  it("ignores budgets from other months", () => {
    render(<BudgetsView />);

    expect(screen.getByText("3 tracked budgets")).toBeInTheDocument();
    expect(screen.queryByText("4 tracked budgets")).not.toBeInTheDocument();
  });

  it("shows a placeholder while the data is loading", () => {
    mockUseUserData.mockReturnValue({
      status: "loading",
      data: null,
      error: null,
      reload: vi.fn(),
    });

    render(<BudgetsView />);

    expect(
      screen.getByRole("status", { name: "Loading budgets" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Housing")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /set budget/i }),
    ).toBeDisabled();
  });

  it("shows the failure with a retry that reloads the data", async () => {
    const reload = vi.fn();
    mockUseUserData.mockReturnValue({
      status: "error",
      data: null,
      error: { message: "Failed to fetch budgets" } as unknown as PostgrestError,
      reload,
    });

    render(<BudgetsView />);

    expect(
      screen.getByText("Could not load your budgets"),
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch budgets")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("shows an empty state when the user has no budgets", () => {
    mockUseUserData.mockReturnValue(
      readyState({ ...DATA, budgets: [] }),
    );

    render(<BudgetsView />);

    expect(screen.getByText(/No budgets for/)).toBeInTheDocument();
  });
});
