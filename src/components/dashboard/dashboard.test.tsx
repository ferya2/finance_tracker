import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Dashboard } from "./dashboard";

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

describe("Dashboard", () => {
  it("shows the summary cards with formatted dummy amounts", () => {
    render(<Dashboard />);

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("$4,821.50")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("$6,850.00")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("$2,028.50")).toBeInTheDocument();
  });

  it("renders recent transactions with signed, formatted amounts", () => {
    render(<Dashboard />);

    expect(screen.getByText("Weekly groceries")).toBeInTheDocument();
    expect(screen.getByText("−$86.35")).toBeInTheDocument();
    expect(screen.getByText("+$2,400.00")).toBeInTheDocument();
  });

  it("renders the category breakdown with shares", () => {
    render(<Dashboard />);

    const breakdown = within(
      screen.getByText("Spending by category").closest("section") as HTMLElement,
    );
    expect(breakdown.getByText("Housing")).toBeInTheDocument();
    expect(breakdown.getByText("57%")).toBeInTheDocument();
  });

  it("renders budget progress and flags the over-budget category", () => {
    render(<Dashboard />);

    const budgets = within(
      screen.getByText("Monthly budgets").closest("section") as HTMLElement,
    );
    expect(budgets.getByText("88% used")).toBeInTheDocument();
    expect(budgets.getByText("Over budget")).toBeInTheDocument();
  });
});