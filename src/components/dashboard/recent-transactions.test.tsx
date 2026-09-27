import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { RecentTransactions } from "./recent-transactions";
import type { DashboardTransactionRow } from "@/lib/finance/dashboard";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const TRANSACTIONS: DashboardTransactionRow[] = [
  {
    id: "txn-1",
    note: "Weekly groceries",
    amount: 8635,
    type: "expense",
    occurredOn: "2026-09-15",
    dateLabel: "Today",
    categoryName: "Food & dining",
    categoryColor: "#e11d48",
  },
  {
    id: "txn-2",
    note: "Monthly salary",
    amount: 240000,
    type: "income",
    occurredOn: "2026-09-14",
    dateLabel: "Yesterday",
    categoryName: "Salary",
    categoryColor: "#059669",
  },
];

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RecentTransactions", () => {
  it("renders each row's note, category, date and signed amount", () => {
    render(<RecentTransactions transactions={TRANSACTIONS} />);

    const rows = screen.getAllByRole("listitem");
    const [groceries, salary] = rows as [HTMLElement, HTMLElement];

    expect(within(groceries).getByText("Weekly groceries")).toBeInTheDocument();
    expect(within(groceries).getByText("Food & dining · Today")).toBeInTheDocument();
    expect(within(groceries).getByText("−$86.35")).toBeInTheDocument();
    expect(within(salary).getByText("Monthly salary")).toBeInTheDocument();
    expect(within(salary).getByText("Salary · Yesterday")).toBeInTheDocument();
    expect(within(salary).getByText("+$2,400.00")).toBeInTheDocument();
  });

  it("counts the rows it shows when nothing is hidden", () => {
    render(<RecentTransactions transactions={TRANSACTIONS} />);

    expect(screen.getByText("2 latest")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /view all/i })).not.toBeInTheDocument();
  });

  it("shows how many of the user's transactions are hidden and links to the rest", () => {
    render(<RecentTransactions transactions={TRANSACTIONS} total={24} />);

    expect(screen.getByText("2 of 24")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute(
      "href",
      "/dashboard/transactions",
    );
  });

  it("falls back to the shown count when the total does not exceed it", () => {
    render(<RecentTransactions transactions={TRANSACTIONS} total={1} />);

    expect(screen.getByText("2 latest")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /view all/i })).not.toBeInTheDocument();
  });

  it("shows an empty state without a list or link when there is nothing to show", () => {
    render(<RecentTransactions transactions={[]} total={0} />);

    expect(
      screen.getByText("No transactions yet — add one to see it here."),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.queryByRole("link", { name: /view all/i })).not.toBeInTheDocument();
  });
});
