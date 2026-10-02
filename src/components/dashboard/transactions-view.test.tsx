import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { TransactionsView } from "./transactions-view";
import type { UserData } from "@/lib/supabase/dashboard";

const { mockUseUserData, mockCreateTransaction } = vi.hoisted(() => ({
  mockUseUserData: vi.fn(),
  mockCreateTransaction: vi.fn(),
}));

vi.mock("@/components/use-user-data", () => ({ useUserData: mockUseUserData }));
vi.mock("@/lib/supabase/transactions", () => ({
  createTransaction: mockCreateTransaction,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const DATA: UserData = {
  transactions: [
    {
      id: "txn-1",
      amount: 240000,
      type: "income",
      categoryId: "cat-salary",
      note: "Monthly salary",
      occurredOn: isoDaysAgo(14),
    },
    {
      id: "txn-2",
      amount: 145000,
      type: "income",
      categoryId: "cat-freelance",
      note: "Design project",
      occurredOn: isoDaysAgo(3),
    },
    {
      id: "txn-3",
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: isoDaysAgo(1),
    },
    {
      id: "txn-4",
      amount: 8635,
      type: "expense",
      categoryId: "cat-food",
      note: "Weekly groceries",
      occurredOn: isoDaysAgo(0),
    },
  ],
  categories: [
    { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
    {
      id: "cat-freelance",
      name: "Freelance",
      color: "#0d9488",
      kind: "income",
    },
    { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
    { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  ],
  budgets: [],
};

/**
 * The list labels dates relative to today, so the fixtures are built from the
 * clock to stay correct whenever the suite runs.
 */
function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function readyState(data: UserData, reload = vi.fn()) {
  return { status: "ready" as const, data, error: null, reload };
}

beforeEach(() => {
  stubMatchMedia(true);
  mockUseUserData.mockReset();
  mockUseUserData.mockReturnValue(readyState(DATA));
  mockCreateTransaction.mockReset();
  mockCreateTransaction.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TransactionsView", () => {
  it("renders the user's transactions newest first with signed amounts", () => {
    render(<TransactionsView />);

    expect(
      screen.getByRole("heading", { name: "Transactions" }),
    ).toBeInTheDocument();

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(4);

    expect(within(items[0] as HTMLElement).getByText("Weekly groceries")).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText("−$86.35")).toBeInTheDocument();
    expect(
      within(items[0] as HTMLElement).getByText("Food & dining · Today"),
    ).toBeInTheDocument();
    expect(within(items[1] as HTMLElement).getByText("Rent")).toBeInTheDocument();
    expect(within(items[1] as HTMLElement).getByText("−$1,150.00")).toBeInTheDocument();
    expect(within(items[2] as HTMLElement).getByText("Design project")).toBeInTheDocument();
    expect(within(items[2] as HTMLElement).getByText("+$1,450.00")).toBeInTheDocument();
    expect(within(items[3] as HTMLElement).getByText("Monthly salary")).toBeInTheDocument();
    expect(within(items[3] as HTMLElement).getByText("+$2,400.00")).toBeInTheDocument();
  });

  it("shows how many of the user's transactions are listed", () => {
    render(<TransactionsView />);

    expect(screen.getByText("4 of 4 shown")).toBeInTheDocument();
  });

  it("falls back to a placeholder for a transaction with no note", () => {
    mockUseUserData.mockReturnValue(
      readyState({
        ...DATA,
        transactions: [
          {
            id: "txn-bare",
            amount: 2500,
            type: "expense",
            categoryId: "cat-food",
            occurredOn: isoDaysAgo(0),
          },
        ],
      }),
    );

    render(<TransactionsView />);

    expect(screen.getByText("No note")).toBeInTheDocument();
  });

  it("filters by income via the segmented control", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Income" }));

    expect(screen.getByText("2 of 4 shown")).toBeInTheDocument();
    await waitForElementToBeRemoved(screen.queryByText("Rent"));
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
    expect(screen.getByText("+$1,450.00")).toBeInTheDocument();
  });

  it("searches the user's transactions by note", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search transactions" }),
      "rent",
    );

    expect(screen.getByText("1 of 4 shown")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    await waitForElementToBeRemoved(screen.queryByText("Monthly salary"));
    expect(screen.queryByText("Monthly salary")).not.toBeInTheDocument();
  });

  it("searches by category name", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search transactions" }),
      "food & dining",
    );

    expect(screen.getByText("1 of 4 shown")).toBeInTheDocument();
    expect(screen.getByText("Weekly groceries")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.type(
      screen.getByRole("searchbox", { name: "Search transactions" }),
      "xyzzy",
    );

    expect(screen.getByText("0 of 4 shown")).toBeInTheDocument();
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("shows a first-run empty state when the user has no transactions", () => {
    mockUseUserData.mockReturnValue(
      readyState({ transactions: [], categories: [], budgets: [] }),
    );

    render(<TransactionsView />);

    expect(screen.getByText("No transactions yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add your first transaction to start tracking."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("shows a placeholder while the data is loading", () => {
    mockUseUserData.mockReturnValue({
      status: "loading",
      data: null,
      error: null,
      reload: vi.fn(),
    });

    render(<TransactionsView />);

    expect(screen.getByRole("status", { name: "Loading transactions" })).toBeInTheDocument();
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
  });

  it("shows the failure with a retry that reloads the data", async () => {
    const reload = vi.fn();
    mockUseUserData.mockReturnValue({
      status: "error",
      data: null,
      error: {
        message: "Failed to fetch transactions",
      } as unknown as PostgrestError,
      reload,
    });

    render(<TransactionsView />);

    expect(
      screen.getByText("Could not load your transactions"),
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch transactions")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("swaps the failure for the list once a retry succeeds", () => {
    mockUseUserData.mockReturnValue({
      status: "error",
      data: null,
      error: { message: "Failed to fetch" } as unknown as PostgrestError,
      reload: vi.fn(),
    });

    const { rerender } = render(<TransactionsView />);
    expect(screen.getByText("Could not load your transactions")).toBeInTheDocument();

    mockUseUserData.mockReturnValue(readyState(DATA));
    rerender(<TransactionsView />);

    // Reduced motion is stubbed on, so the swap lands without a transition.
    expect(
      screen.queryByText("Could not load your transactions"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Monthly salary")).toBeInTheDocument();
  });

  it("opens the add-transaction form from the page header", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /add transaction/i }));

    expect(screen.getByRole("dialog", { name: "Add transaction" })).toBeInTheDocument();
    // Only the user's own categories are offered.
    expect(
      Array.from(
        screen.getByLabelText("Category").querySelectorAll("option"),
      ).map((option) => option.textContent),
    ).toEqual(["Choose a category", "Housing", "Food & dining"]);
  });

  it("saves a new transaction and reloads the list", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mockUseUserData.mockReturnValue(readyState(DATA, reload));
    mockCreateTransaction.mockResolvedValue({
      data: {
        id: "txn-new",
        amount: 4500,
        type: "expense",
        categoryId: "cat-food",
        note: "Coffee",
        occurredOn: isoDaysAgo(0),
      },
      error: null,
    });
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: /add transaction/i }));
    await user.type(screen.getByLabelText("Amount"), "45");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.type(screen.getByLabelText("Note"), "Coffee");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(mockCreateTransaction).toHaveBeenCalledWith({
      amount: 4500,
      type: "expense",
      categoryId: "cat-food",
      note: "Coffee",
      occurredOn: isoDaysAgo(0),
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the form open and explains the failure when the save fails", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mockUseUserData.mockReturnValue(readyState(DATA, reload));
    mockCreateTransaction.mockResolvedValue({
      data: null,
      error: { message: "Failed to insert transaction" } as unknown as PostgrestError,
    });
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: /add transaction/i }));
    await user.type(screen.getByLabelText("Amount"), "45");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(
      await screen.findByText("Failed to insert transaction"),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Add transaction" })).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it("cannot open the form before the user's categories have loaded", () => {
    mockUseUserData.mockReturnValue({
      status: "loading",
      data: null,
      error: null,
      reload: vi.fn(),
    });

    render(<TransactionsView />);

    expect(screen.getByRole("button", { name: /add transaction/i })).toBeDisabled();
  });
});
