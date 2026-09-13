import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoriesView } from "./categories-view";

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

describe("CategoriesView", () => {
  it("renders every dummy category with its monthly total", () => {
    render(<CategoriesView />);

    expect(screen.getByRole("heading", { name: "Categories" })).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("Food & dining")).toBeInTheDocument();
    expect(screen.getByText("$1,150.00")).toBeInTheDocument();
    expect(screen.getByText("$382.40")).toBeInTheDocument();
  });

  it("labels income categories as income", () => {
    render(<CategoriesView />);

    expect(screen.getAllByText("Income").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Expense").length).toBeGreaterThanOrEqual(6);
  });
});