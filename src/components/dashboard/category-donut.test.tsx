import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryDonut } from "./category-donut";
import { buildDonutBreakdown } from "@/lib/finance/donut";
import type { DonutSourceRow } from "@/lib/finance/donut";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const ROWS: DonutSourceRow[] = [
  {
    categoryId: "cat-housing",
    categoryName: "Housing",
    categoryColor: "#d97706",
    amount: 115000,
  },
  {
    categoryId: "cat-food",
    categoryName: "Food & dining",
    categoryColor: "#e11d48",
    amount: 8635,
  },
];

/** The coloured arcs, i.e. every circle except the grey track behind them. */
function arcs(container: HTMLElement): SVGCircleElement[] {
  return [...container.querySelectorAll("circle")].filter(
    (circle) => circle.getAttribute("stroke") !== null,
  );
}

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CategoryDonut", () => {
  it("shows the month's total in the middle of the ring", () => {
    render(<CategoryDonut breakdown={buildDonutBreakdown(ROWS)} />);

    expect(screen.getByText("$1,236.35")).toBeInTheDocument();
    expect(screen.getByText("spent this month")).toBeInTheDocument();
  });

  it("lists every slice with its amount and share", () => {
    render(<CategoryDonut breakdown={buildDonutBreakdown(ROWS)} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Housing$1,150.0093%");
    expect(rows[1]).toHaveTextContent("Food & dining$86.357%");
  });

  it("draws one coloured arc per slice, in the category's colour", () => {
    const { container } = render(
      <CategoryDonut breakdown={buildDonutBreakdown(ROWS)} />,
    );

    expect(arcs(container).map((arc) => arc.getAttribute("stroke"))).toEqual([
      "#d97706",
      "#e11d48",
    ]);
  });

  it("leaves a small gap between neighbouring arcs so they stay readable", () => {
    const { container } = render(
      <CategoryDonut breakdown={buildDonutBreakdown(ROWS)} />,
    );

    const [first, second] = arcs(container);
    const dash = (circle: SVGCircleElement) =>
      Number(circle.getAttribute("stroke-dasharray")?.split(" ")[0]);

    // 93% of the ring minus the 1.5% gap, and 7% minus the same gap.
    expect(dash(first as SVGCircleElement)).toBeLessThan(
      0.93 * 2 * Math.PI * 75,
    );
    expect(dash(second as SVGCircleElement)).toBeGreaterThan(0);
  });

  it("closes the ring fully when a single category covers the month", () => {
    const { container } = render(
      <CategoryDonut breakdown={buildDonutBreakdown([ROWS[0] as DonutSourceRow])} />,
    );

    const circumference = 2 * Math.PI * 75;
    const [only] = arcs(container);
    const dash = Number(only?.getAttribute("stroke-dasharray")?.split(" ")[0]);

    expect(dash).toBeCloseTo(circumference, 1);
  });

  it("renders the merged tail as one Other slice", () => {
    const many: DonutSourceRow[] = Array.from({ length: 8 }, (_, index) => ({
      categoryId: `cat-${index}`,
      categoryName: `Category ${index}`,
      categoryColor: "#059669",
      amount: 100 * (8 - index),
    }));

    render(<CategoryDonut breakdown={buildDonutBreakdown(many)} />);

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(6);
    expect(rows.at(-1)).toHaveTextContent("Other$6.0017%");
  });

  it("draws no arcs when there is nothing to chart", () => {
    const { container } = render(
      <CategoryDonut breakdown={buildDonutBreakdown([])} />,
    );

    expect(arcs(container)).toHaveLength(0);
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });
});
