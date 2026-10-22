import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrendLineChart } from "./trend-line-chart";
import type { TrendPoint } from "@/lib/finance/trend";

const POINTS: TrendPoint[] = [
  { key: "2026-09-01", label: "1 Sep", income: 500000, expense: 1200, count: 2 },
  { key: "2026-09-02", label: "2 Sep", income: 0, expense: 4500, count: 1 },
  { key: "2026-09-03", label: "3 Sep", income: 0, expense: 0, count: 0 },
];

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

describe("TrendLineChart", () => {
  it("labels the axis with the points it shows", () => {
    render(<TrendLineChart points={POINTS} />);

    expect(screen.getAllByText("1 Sep").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2 Sep").length).toBeGreaterThan(0);
    expect(screen.getAllByText("3 Sep").length).toBeGreaterThan(0);
  });

  it("draws the trend as a line and an area", () => {
    const { container } = render(<TrendLineChart points={POINTS} />);

    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(3);
    expect(paths[0].getAttribute("d")).toContain("M 0.00");
  });

  it("exposes the spending of every point to screen readers", () => {
    render(<TrendLineChart points={POINTS} />);

    const table = screen.getByRole("table", { hidden: true });
    expect(table).toHaveTextContent("Spending over time");
    expect(table).toHaveTextContent("1 Sep");
    expect(table).toHaveTextContent("$12.00");
    expect(table).toHaveTextContent("$45.00");
  });

  it("can show income instead of spending", () => {
    render(<TrendLineChart points={POINTS} measure="income" />);

    const table = screen.getByRole("table", { hidden: true });
    expect(table).toHaveTextContent("Income over time");
    expect(table).toHaveTextContent("$5,000.00");
  });

  it("renders nothing to plot when there are no points", () => {
    const { container } = render(<TrendLineChart points={[]} />);

    expect(container.querySelectorAll("path")).toHaveLength(0);
    expect(screen.getByRole("table", { hidden: true }).querySelectorAll("tbody tr")).toHaveLength(0);
  });
});
