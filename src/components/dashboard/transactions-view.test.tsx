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
import { ALL_CATEGORIES } from "@/lib/finance/transaction-filter";
import { ALL_MONTHS } from "@/lib/finance/transaction-month";
import { formatMonthLabel } from "@/lib/finance/period";
import type { UserData } from "@/lib/supabase/dashboard";

const {
  mockUseUserData,
  mockCreateTransaction,
  mockUpdateTransaction,
  mockDeleteTransaction,
} = vi.hoisted(() => ({
  mockUseUserData: vi.fn(),
  mockCreateTransaction: vi.fn(),
  mockUpdateTransaction: vi.fn(),
  mockDeleteTransaction: vi.fn(),
}));

vi.mock("@/components/use-user-data", () => ({ useUserData: mockUseUserData }));
vi.mock("@/lib/supabase/transactions", () => ({
  createTransaction: mockCreateTransaction,
  updateTransaction: mockUpdateTransaction,
  deleteTransaction: mockDeleteTransaction,
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

/**
 * A `YYYY-MM-DD` date in a month offset from today (0 = this month, -1 = last
 * month), pinned to the 15th so it never drifts across a boundary. Deriving the
 * date from the clock keeps the month filter correct whenever the suite runs.
 */
function isoInMonth(monthOffset: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 15);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** The `YYYY-MM` key for a month offset from today, matching the select value. */
function monthKeyIn(monthOffset: number): string {
  return isoInMonth(monthOffset).slice(0, 7);
}

/** The label the month select shows for a month offset from today. */
function monthLabel(monthOffset: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return formatMonthLabel(date.getFullYear(), date.getMonth() + 1);
}

beforeEach(() => {
  stubMatchMedia(true);
  mockUseUserData.mockReset();
  mockUseUserData.mockReturnValue(readyState(DATA));
  mockCreateTransaction.mockReset();
  mockCreateTransaction.mockResolvedValue({ data: null, error: null });
  mockUpdateTransaction.mockReset();
  mockUpdateTransaction.mockResolvedValue({ data: null, error: null });
  mockDeleteTransaction.mockReset();
  mockDeleteTransaction.mockResolvedValue({ error: null });
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

  it("filters by category via the category select", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.selectOptions(
      screen.getByLabelText("Filter by category"),
      "cat-housing",
    );

    expect(screen.getByText("1 of 4 shown")).toBeInTheDocument();
    await waitForElementToBeRemoved(screen.queryByText("Monthly salary"));
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.queryByText("Weekly groceries")).not.toBeInTheDocument();
  });

  it("combines the type and category filters", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Income" }));
    await user.selectOptions(
      screen.getByLabelText("Filter by category"),
      "cat-housing",
    );

    expect(screen.getByText("0 of 4 shown")).toBeInTheDocument();
    expect(screen.getByText("No matches")).toBeInTheDocument();
    await waitForElementToBeRemoved(screen.queryByText("Rent"));
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
  });

  it("clears every filter at once", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    expect(
      screen.queryByRole("button", { name: "Clear filters" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Income" }));
    await user.selectOptions(
      screen.getByLabelText("Filter by category"),
      "cat-food",
    );
    await user.type(
      screen.getByRole("searchbox", { name: "Search transactions" }),
      "groceries",
    );

    expect(screen.getByText("0 of 4 shown")).toBeInTheDocument();
    expect(screen.getByText("No matches")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByText("4 of 4 shown")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search transactions" }),
    ).toHaveValue("");
    expect(
      screen.getByLabelText("Filter by category"),
    ).toHaveValue(ALL_CATEGORIES);
    expect(
      screen.queryByRole("button", { name: "Clear filters" }),
    ).not.toBeInTheDocument();
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

  it("opens an edit form prefilled from the row that was clicked", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Rent" }));

    expect(
      screen.getByRole("dialog", { name: "Edit transaction" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toHaveValue("1150");
    expect(screen.getByLabelText("Category")).toHaveValue("cat-housing");
    expect(screen.getByLabelText("Note")).toHaveValue("Rent");
    expect(screen.getByLabelText("Date")).toHaveValue(isoDaysAgo(1));
  });

  it("saves a correction to the edited transaction and reloads the list", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mockUseUserData.mockReturnValue(readyState(DATA, reload));
    mockUpdateTransaction.mockResolvedValue({
      data: {
        id: "txn-3",
        amount: 125000,
        type: "expense",
        categoryId: "cat-housing",
        note: "Rent and utilities",
        occurredOn: isoDaysAgo(1),
      },
      error: null,
    });
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Edit Rent" }));
    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "1250");
    await user.clear(screen.getByLabelText("Note"));
    await user.type(screen.getByLabelText("Note"), "Rent and utilities");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-3", {
      amount: 125000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent and utilities",
      occurredOn: isoDaysAgo(1),
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the edit form open and explains the failure when the update fails", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mockUseUserData.mockReturnValue(readyState(DATA, reload));
    mockUpdateTransaction.mockResolvedValue({
      data: null,
      error: { message: "Failed to update transaction" } as unknown as PostgrestError,
    });
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Edit Rent" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("Failed to update transaction"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Edit transaction" }),
    ).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it("closes the edit form without saving", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Edit Rent" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockUpdateTransaction).not.toHaveBeenCalled();
  });

  it("asks before deleting a transaction", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Delete Rent" }));

    expect(
      screen.getByRole("dialog", { name: "Delete this transaction?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This removes "Rent" · −$1,150.00 from your history. You can undo it from the message that follows.',
      ),
    ).toBeInTheDocument();
    expect(mockDeleteTransaction).not.toHaveBeenCalled();
    expect(screen.getByText("Rent")).toBeInTheDocument();
  });

  it("keeps the transaction when the confirmation is backed out of", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Delete Rent" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockDeleteTransaction).not.toHaveBeenCalled();
    expect(screen.getByText("Rent")).toBeInTheDocument();
  });

  it("deletes the confirmed transaction and offers an undo snackbar", async () => {
    const user = userEvent.setup();
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Delete Rent" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(mockDeleteTransaction).toHaveBeenCalledWith("txn-3"),
    );
    expect(mockDeleteTransaction).toHaveBeenCalledOnce();
    await waitForElementToBeRemoved(screen.queryByText("Rent"));
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
    expect(screen.getByText("3 of 3 shown")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      'Deleted "Rent" · −$1,150.00',
    );
    expect(
      screen.getByRole("button", { name: "Undo" }),
    ).toBeInTheDocument();
  });

  it("puts the transaction back when the undo is used", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mockUseUserData.mockReturnValue(readyState(DATA, reload));
    mockCreateTransaction.mockResolvedValue({
      data: { ...DATA.transactions[2], id: "txn-restored" },
      error: null,
    });
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Delete Rent" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));

    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(mockCreateTransaction).toHaveBeenCalledWith({
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: isoDaysAgo(1),
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("says so when the delete fails and keeps the transaction listed", async () => {
    const user = userEvent.setup();
    mockDeleteTransaction.mockResolvedValue({
      error: { message: "Failed to delete transaction" } as unknown as PostgrestError,
    });
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Delete Rent" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Failed to delete transaction")).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Delete this transaction?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("says so when the undo cannot be put back", async () => {
    const user = userEvent.setup();
    mockCreateTransaction.mockResolvedValue({
      data: null,
      error: { message: "Failed to insert transaction" } as unknown as PostgrestError,
    });
    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Delete Rent" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(await screen.findByRole("button", { name: "Undo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to insert transaction",
    );
  });

  it("filters transactions by month via the month select", async () => {
    const user = userEvent.setup();
    mockUseUserData.mockReturnValue(
      readyState({
        transactions: [
          {
            id: "txn-last",
            amount: 5000,
            type: "expense",
            categoryId: "cat-food",
            note: "Last month groceries",
            occurredOn: isoInMonth(-1),
          },
          {
            id: "txn-now-a",
            amount: 8635,
            type: "expense",
            categoryId: "cat-food",
            note: "This month groceries",
            occurredOn: isoInMonth(0),
          },
          {
            id: "txn-now-b",
            amount: 240000,
            type: "income",
            categoryId: "cat-salary",
            note: "Monthly salary",
            occurredOn: isoInMonth(0),
          },
        ],
        categories: DATA.categories,
        budgets: [],
      }),
    );

    render(<TransactionsView />);

    expect(screen.getByText("3 of 3 shown")).toBeInTheDocument();
    // The month choices are labelled with their month and year.
    expect(
      within(screen.getByLabelText("Filter by month")).getByRole("option", {
        name: monthLabel(0),
      }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Filter by month"),
      monthKeyIn(0),
    );

    expect(screen.getByText("2 of 3 shown")).toBeInTheDocument();
    await waitForElementToBeRemoved(
      screen.queryByText("Last month groceries"),
    );
    expect(screen.getByText("This month groceries")).toBeInTheDocument();
    expect(
      screen.queryByText("Last month groceries"),
    ).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Filter by month"),
      monthKeyIn(-1),
    );

    expect(screen.getByText("1 of 3 shown")).toBeInTheDocument();
    expect(screen.getByText("Last month groceries")).toBeInTheDocument();
    await waitForElementToBeRemoved(
      screen.queryByText("This month groceries"),
    );
    expect(
      screen.queryByText("This month groceries"),
    ).not.toBeInTheDocument();
  });

  it("clears the month filter along with the rest", async () => {
    const user = userEvent.setup();
    mockUseUserData.mockReturnValue(
      readyState({
        transactions: [
          {
            id: "txn-last",
            amount: 5000,
            type: "expense",
            categoryId: "cat-food",
            note: "Last month groceries",
            occurredOn: isoInMonth(-1),
          },
          {
            id: "txn-now",
            amount: 8635,
            type: "expense",
            categoryId: "cat-food",
            note: "This month groceries",
            occurredOn: isoInMonth(0),
          },
        ],
        categories: DATA.categories,
        budgets: [],
      }),
    );

    render(<TransactionsView />);

    await user.selectOptions(
      screen.getByLabelText("Filter by month"),
      monthKeyIn(0),
    );
    expect(screen.getByText("1 of 2 shown")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(screen.getByText("2 of 2 shown")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by month")).toHaveValue(ALL_MONTHS);
  });

  it("paginates long lists and pages through them", async () => {
    const user = userEvent.setup();
    const transactions = Array.from({ length: 12 }, (_, index) => ({
      id: `txn-page-${index}`,
      amount: 1000 + index,
      type: "expense" as const,
      categoryId: "cat-food",
      note: `Page item ${index}`,
      occurredOn: isoInMonth(0),
    }));
    mockUseUserData.mockReturnValue(readyState({ ...DATA, transactions }));

    render(<TransactionsView />);

    expect(screen.getAllByRole("listitem")).toHaveLength(10);
    expect(screen.getByText("12 of 12 shown")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next page" }));

    // List rows animate out over a beat, so wait for page one to clear.
    await waitForElementToBeRemoved(screen.queryByText("Page item 9"));
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Previous page" }),
    ).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Previous page" }));

    await waitForElementToBeRemoved(screen.queryByText("Page item 10"));
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(10);
  });

  it("returns to the first page when the criteria change", async () => {
    const user = userEvent.setup();
    const transactions = Array.from({ length: 12 }, (_, index) => ({
      id: `txn-page-${index}`,
      amount: 1000 + index,
      type: "expense" as const,
      categoryId: "cat-food",
      note: `Page item ${index}`,
      occurredOn: isoInMonth(0),
    }));
    mockUseUserData.mockReturnValue(readyState({ ...DATA, transactions }));

    render(<TransactionsView />);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();

    await user.type(
      screen.getByRole("searchbox", { name: "Search transactions" }),
      "item 11",
    );

    expect(screen.getByText("1 of 12 shown")).toBeInTheDocument();
    expect(screen.queryByText("Page 2 of 2")).not.toBeInTheDocument();
    expect(screen.getByText("Page item 11")).toBeInTheDocument();
  });
});
