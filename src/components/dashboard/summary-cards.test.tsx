import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryCards } from "./summary-cards";
import type { SummaryCardData } from "@/lib/finance/summary";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const CARDS: SummaryCardData[] = [
  { key: "balance", label: "Balance", amount: 66365, caption: "All time", trend: null },
  {
    key: "income",
    label: "Income",
    amount: 240000,
    caption: "September",
    trend: { direction: "up", percent: 20, previousMonthName: "August" },
  },
  {
    key: "expense",
    label: "Expense",
    amount: 123635,
    caption: "September",
    trend: { direction: "down", percent: -7, previousMonthName: "August" },
  },
];

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SummaryCards", () => {
  it("renders every card's label, amount and caption", () => {
    render(<SummaryCards cards={CARDS} />);

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("$663.65")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("$2,400.00")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("$1,236.35")).toBeInTheDocument();
    expect(screen.getAllByText("September")).toHaveLength(2);
  });

  it("shows the month-over-month change without its sign", () => {
    render(<SummaryCards cards={CARDS} />);

    expect(screen.getByText("20% vs August")).toBeInTheDocument();
    expect(screen.getByText("7% vs August")).toBeInTheDocument();
  });

  it("omits the change on cards that have nothing to compare", () => {
    render(<SummaryCards cards={CARDS} />);

    expect(screen.getAllByText(/vs August$/)).toHaveLength(2);
  });

  it("renders zeroed cards for an empty view model", () => {
    render(
      <SummaryCards
        cards={CARDS.map((card) => ({ ...card, amount: 0, trend: null }))}
      />,
    );

    expect(screen.getAllByText("$0.00")).toHaveLength(3);
    expect(screen.queryByText(/vs /)).not.toBeInTheDocument();
  });
});
