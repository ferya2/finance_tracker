import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportsView } from "./reports-view";
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

/** A `YYYY-MM-DD` date a number of days from today (0 = today). */
function isoDaysFromToday(days: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

const DATA: UserData = {
  transactions: [
    {
      id: "txn-1",
      amount: 4500,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: isoDaysFromToday(-1),
    },
    {
      id: "txn-2",
      amount: 500000,
      type: "income",
      categoryId: "cat-salary",
      note: "Salary",
      occurredOn: isoDaysFromToday(0),
    },
  ],
  categories: [],
  budgets: [],
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

describe("ReportsView", () => {
  it("renders the income vs expense chart with a legend", () => {
    render(<ReportsView />);

    expect(screen.getByRole("heading", { name: "Reports" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Income vs expenses" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Last 6 months")).toBeInTheDocument();
    expect(screen.getAllByText("Income").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Expenses").length).toBeGreaterThan(0);
  });

  it("renders the spending-share donut with per-category figures", () => {
    render(<ReportsView />);

    expect(screen.getByText("Spending shares")).toBeInTheDocument();
    expect(screen.getByText("$2,028.50")).toBeInTheDocument();
    expect(screen.getByText("spent this month")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("57%")).toBeInTheDocument();
  });

  it("renders the balance trend with the period end balance", () => {
    render(<ReportsView />);

    expect(screen.getByText("Balance trend")).toBeInTheDocument();
    expect(screen.getByText("$4,821.50")).toBeInTheDocument();
    expect(screen.getByText("Balance at the end of the period:")).toBeInTheDocument();
  });

  it("renders the spending trend from the user's own transactions", () => {
    render(<ReportsView />);

    expect(
      screen.getByRole("heading", { name: "Spending over time" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(screen.getAllByText("$45.00").length).toBeGreaterThan(0);
  });

  it("links to the composed reports", () => {
    render(<ReportsView />);

    expect(screen.getByRole("link", { name: "Custom range" })).toHaveAttribute(
      "href",
      "/dashboard/reports/range",
    );
    expect(screen.getByRole("link", { name: "Monthly report" })).toHaveAttribute(
      "href",
      "/dashboard/reports/monthly",
    );
    expect(screen.getByRole("link", { name: "Yearly overview" })).toHaveAttribute(
      "href",
      "/dashboard/reports/yearly",
    );
  });

  it("shows the 3D accent tile even without WebGL", () => {
    render(<ReportsView />);

    expect(screen.getByText("Your spending, at a glance")).toBeInTheDocument();
  });
});
