import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { InsightsView } from "./insights-view";

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

describe("InsightsView", () => {
  it("renders the leading stat cards from dummy insights", () => {
    render(<InsightsView />);

    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument();
    expect(screen.getByText("Daily average")).toBeInTheDocument();
    expect(screen.getByText("$67.62")).toBeInTheDocument();
    expect(screen.getByText("Savings rate")).toBeInTheDocument();
    expect(screen.getAllByText("70%")).toHaveLength(1);
    expect(screen.getByText("vs last month")).toBeInTheDocument();
    expect(screen.getByText("−4%")).toBeInTheDocument();
  });

  it("ranks the top spending categories", () => {
    render(<InsightsView />);

    expect(screen.getByText("Top categories")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("Food & dining")).toBeInTheDocument();
  });

  it("highlights the biggest expense and lists the tips", () => {
    render(<InsightsView />);

    expect(screen.getByText("Biggest single expense")).toBeInTheDocument();
    expect(screen.getAllByText("$1,150.00").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Notes for you")).toBeInTheDocument();
    expect(
      screen.getByText("You spent 4% less in September than in August."),
    ).toBeInTheDocument();
  });
});