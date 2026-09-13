import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetsView } from "./budgets-view";

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

describe("BudgetsView", () => {
  it("renders every dummy budget with spent and limit", () => {
    render(<BudgetsView />);

    expect(screen.getByRole("heading", { name: "Budgets" })).toBeInTheDocument();
    expect(screen.getByText("5 tracked budgets")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("$1,150.00")).toBeInTheDocument();
    expect(screen.getByText(/1,300\.00/)).toBeInTheDocument();
    expect(screen.getByText("$150.00 left this month")).toBeInTheDocument();
  });

  it("flags over-budget categories", () => {
    render(<BudgetsView />);

    const overBadges = screen.getAllByText("Over budget");
    expect(overBadges).toHaveLength(1);
    expect(screen.getByText("Over by $32.40")).toBeInTheDocument();
    expect(screen.getByText("1 need attention")).toBeInTheDocument();
  });
});