import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetGauge } from "./budget-gauge";
import { summarizeBudgets, type BudgetProgressRow } from "@/lib/finance/budget";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

function row(limit: number, spent: number): BudgetProgressRow {
  return {
    limit,
    spent,
    remaining: limit - spent,
    percent: limit > 0 ? Math.round((spent / limit) * 100) : 0,
    overBudget: spent > 0 && spent > limit,
  };
}

/** The coloured arc, i.e. every circle except the grey track behind it. */
function arc(container: HTMLElement): SVGCircleElement {
  const [colored] = [...container.querySelectorAll("circle")].filter(
    (circle) =>
      !(circle.getAttribute("class") ?? "").includes("surface-subtle"),
  );
  return colored as SVGCircleElement;
}

/** The drawn length of the arc, in units of the ring's circumference. */
function dashRatio(container: HTMLElement): number {
  const circumference = 2 * Math.PI * 28.5;
  const drawn = Number(arc(container).getAttribute("stroke-dasharray")?.split(" ")[0]);
  return drawn / circumference;
}

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BudgetGauge", () => {
  it("shows how much of the month's limits is spent in the middle", () => {
    render(
      <BudgetGauge totals={summarizeBudgets([row(100000, 28000)])} />,
    );

    expect(screen.getByText("28%")).toBeInTheDocument();
  });

  it("draws the arc to match the percentage used", () => {
    const { container } = render(
      <BudgetGauge totals={summarizeBudgets([row(100000, 42500)])} />,
    );

    expect(dashRatio(container)).toBeCloseTo(0.43, 2);
  });

  it("fills the ring only once the month's spending goes over its limits", () => {
    const { container } = render(
      <BudgetGauge totals={summarizeBudgets([row(5000, 8635)])} />,
    );

    expect(dashRatio(container)).toBeCloseTo(1, 3);
  });

  it("colours the arc by how close the month is to its limits", () => {
    const onTrack = render(
      <BudgetGauge totals={summarizeBudgets([row(100000, 10000)])} />,
    );
    expect(arc(onTrack.container).getAttribute("class")).toContain("stroke-primary");

    const warning = render(
      <BudgetGauge totals={summarizeBudgets([row(100000, 85000)])} />,
    );
    expect(arc(warning.container).getAttribute("class")).toContain("stroke-warning");

    const over = render(
      <BudgetGauge totals={summarizeBudgets([row(100000, 120000)])} />,
    );
    expect(arc(over.container).getAttribute("class")).toContain("stroke-danger");
  });

  it("draws an empty ring when nothing has been spent yet", () => {
    const { container } = render(
      <BudgetGauge totals={summarizeBudgets([row(100000, 0)])} />,
    );

    expect(dashRatio(container)).toBe(0);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
