import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportsView } from "./reports-view";

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

describe("ReportsView", () => {
  it("renders the income vs expense chart with a legend", () => {
    render(<ReportsView />);

    expect(screen.getByRole("heading", { name: "Reports" })).toBeInTheDocument();
    expect(screen.getByText("Income vs expenses")).toBeInTheDocument();
    expect(screen.getByText("Last 6 months")).toBeInTheDocument();
    expect(screen.getAllByText("Apr").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sep").length).toBeGreaterThan(0);
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Expenses")).toBeInTheDocument();
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

  it("shows the 3D accent tile even without WebGL", () => {
    render(<ReportsView />);

    expect(screen.getByText("Your spending, at a glance")).toBeInTheDocument();
  });
});