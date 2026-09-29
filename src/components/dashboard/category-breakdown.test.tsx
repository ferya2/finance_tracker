import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryBreakdown } from "./category-breakdown";
import type { DashboardBreakdownRow } from "@/lib/finance/dashboard";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const ROWS: DashboardBreakdownRow[] = [
  {
    categoryId: "cat-housing",
    categoryName: "Housing",
    categoryColor: "#d97706",
    amount: 115000,
    sharePercent: 93,
  },
  {
    categoryId: "cat-food",
    categoryName: "Food & dining",
    categoryColor: "#e11d48",
    amount: 8635,
    sharePercent: 7,
  },
];

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CategoryBreakdown", () => {
  it("shows the animated bars by default", () => {
    render(<CategoryBreakdown rows={ROWS} />);

    const widget = within(
      screen.getByText("Spending by category").closest("section") as HTMLElement,
    );
    const rows = widget.getAllByRole("listitem");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Housing$1,150.0093%");
    expect(screen.getByRole("button", { name: "Bars" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("switches to an animated donut of the same spending", async () => {
    render(<CategoryBreakdown rows={ROWS} />);

    await userEvent.click(screen.getByRole("button", { name: "Donut" }));

    const widget = within(
      screen.getByText("Spending by category").closest("section") as HTMLElement,
    );
    const rows = widget.getAllByRole("listitem");

    expect(screen.getByRole("button", { name: "Donut" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(rows[0]).toHaveTextContent("Housing$1,150.0093%");
    expect(widget.getByText("$1,236.35")).toBeInTheDocument();
  });

  it("switches back to the bars", async () => {
    render(<CategoryBreakdown rows={ROWS} />);

    await userEvent.click(screen.getByRole("button", { name: "Donut" }));
    await userEvent.click(screen.getByRole("button", { name: "Bars" }));

    expect(screen.getByRole("button", { name: "Bars" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps the empty state and hides the chart switch when nothing was spent", () => {
    render(<CategoryBreakdown rows={[]} />);

    expect(
      screen.getByText("No spending recorded for this month yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Donut" })).not.toBeInTheDocument();
  });
});
