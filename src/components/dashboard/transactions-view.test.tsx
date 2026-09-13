import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionsView } from "./transactions-view";

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

describe("TransactionsView", () => {
  it("renders the full dummy month with signed amounts", () => {
    render(<TransactionsView />);

    expect(screen.getByRole("heading", { name: "Transactions" })).toBeInTheDocument();
    expect(screen.getByText("Monthly salary")).toBeInTheDocument();
    expect(screen.getByText("+$2,400.00")).toBeInTheDocument();
    expect(screen.getByText("−$86.35")).toBeInTheDocument();
    expect(screen.getByText("18 of 18 shown")).toBeInTheDocument();
  });

  it("filters by income via the segmented control", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Income" }));

    expect(screen.getByText("4 of 18 shown")).toBeInTheDocument();
    await waitForElementToBeRemoved(screen.queryByText("Rent"));
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
    expect(screen.getByText("+$1,800.00")).toBeInTheDocument();
  });

  it("searches transactions by note", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    const search = screen.getByRole("searchbox", { name: "Search transactions" });
    await user.type(search, "rent");

    expect(screen.getByText("1 of 18 shown")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    await waitForElementToBeRemoved(screen.queryByText("Monthly salary"));
    expect(screen.queryByText("Monthly salary")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search transactions" }),
      "xyzzy",
    );

    expect(screen.getByText("0 of 18 shown")).toBeInTheDocument();
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });
});