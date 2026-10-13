import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { CategoriesView } from "./categories-view";
import type { UserData } from "@/lib/supabase/dashboard";

const {
  mockUseUserData,
  mockCreateCategory,
  mockUpdateCategory,
  mockDeleteCategory,
  mockReassignTransactions,
} = vi.hoisted(() => ({
  mockUseUserData: vi.fn(),
  mockCreateCategory: vi.fn(),
  mockUpdateCategory: vi.fn(),
  mockDeleteCategory: vi.fn(),
  mockReassignTransactions: vi.fn(),
}));

vi.mock("@/components/use-user-data", () => ({ useUserData: mockUseUserData }));
vi.mock("@/lib/supabase/categories", () => ({
  createCategory: mockCreateCategory,
  updateCategory: mockUpdateCategory,
  deleteCategory: mockDeleteCategory,
}));
vi.mock("@/lib/supabase/transactions", () => ({
  reassignTransactions: mockReassignTransactions,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

/**
 * A `YYYY-MM-DD` date in a month offset from today (0 = this month, -1 = last
 * month), pinned to the 15th so it never drifts across a boundary. Deriving the
 * date from the clock keeps the monthly totals correct whenever the suite runs.
 */
function isoInMonth(monthOffset: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 15);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

const DATA: UserData = {
  transactions: [
    {
      id: "txn-1",
      amount: 240000,
      type: "income",
      categoryId: "cat-salary",
      note: "Monthly salary",
      occurredOn: isoInMonth(0),
    },
    {
      id: "txn-2",
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: isoInMonth(0),
    },
    {
      id: "txn-3",
      amount: 38240,
      type: "expense",
      categoryId: "cat-food",
      note: "Groceries",
      occurredOn: isoInMonth(0),
    },
    {
      id: "txn-4",
      amount: 5000,
      type: "expense",
      categoryId: "cat-food",
      note: "Last month groceries",
      occurredOn: isoInMonth(-1),
    },
  ],
  categories: [
    { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
    { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
    { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  ],
  budgets: [],
};

function readyState(data: UserData, reload = vi.fn()) {
  return { status: "ready" as const, data, error: null, reload };
}

beforeEach(() => {
  stubMatchMedia(true);
  mockUseUserData.mockReset();
  mockUseUserData.mockReturnValue(readyState(DATA));
  mockCreateCategory.mockReset();
  mockUpdateCategory.mockReset();
  mockDeleteCategory.mockReset();
  mockDeleteCategory.mockResolvedValue({ error: null });
  mockReassignTransactions.mockReset();
  mockReassignTransactions.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CategoriesView", () => {
  it("renders every category with its monthly total", () => {
    render(<CategoriesView />);

    expect(
      screen.getByRole("heading", { name: "Categories" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Housing")).toBeInTheDocument();
    expect(screen.getByText("Food & dining")).toBeInTheDocument();
    expect(screen.getByText("$2,400.00")).toBeInTheDocument();
    expect(screen.getByText("$1,150.00")).toBeInTheDocument();
    expect(screen.getByText("$382.40")).toBeInTheDocument();
  });

  it("labels income categories as income", () => {
    render(<CategoriesView />);

    expect(screen.getAllByText("Income")).toHaveLength(1);
    expect(screen.getAllByText("Expense")).toHaveLength(2);
  });

  it("totals only the current month's transactions", () => {
    render(<CategoriesView />);

    // The previous month's 5000 cent food row is excluded from the total.
    expect(screen.queryByText("$432.40")).not.toBeInTheDocument();
    expect(screen.getByText("$382.40")).toBeInTheDocument();
  });

  it("shows a category with no activity this month as zero", () => {
    mockUseUserData.mockReturnValue(
      readyState({
        ...DATA,
        categories: [
          ...DATA.categories,
          {
            id: "cat-fun",
            name: "Entertainment",
            color: "#db2777",
            kind: "expense",
          },
        ],
      }),
    );

    render(<CategoriesView />);

    expect(screen.getByText("Entertainment")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("shows a placeholder while the data is loading", () => {
    mockUseUserData.mockReturnValue({
      status: "loading",
      data: null,
      error: null,
      reload: vi.fn(),
    });

    render(<CategoriesView />);

    expect(
      screen.getByRole("status", { name: "Loading categories" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Salary")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /new category/i }),
    ).toBeDisabled();
  });

  it("shows the failure with a retry that reloads the data", async () => {
    const reload = vi.fn();
    mockUseUserData.mockReturnValue({
      status: "error",
      data: null,
      error: { message: "Failed to fetch categories" } as unknown as PostgrestError,
      reload,
    });

    render(<CategoriesView />);

    expect(
      screen.getByText("Could not load your categories"),
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch categories")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("shows an empty state when the user has no categories", () => {
    mockUseUserData.mockReturnValue(
      readyState({ transactions: [], categories: [], budgets: [] }),
    );

    render(<CategoriesView />);

    expect(screen.getByText("No categories yet")).toBeInTheDocument();
  });

  it("opens the new-category form from the header button", async () => {
    render(<CategoriesView />);

    await userEvent.click(screen.getByRole("button", { name: /new category/i }));

    expect(
      screen.getByRole("dialog", { name: "New category" }),
    ).toBeInTheDocument();
  });

  it("opens the edit form prefilled from a category card", async () => {
    render(<CategoriesView />);

    await userEvent.click(
      screen.getByRole("button", { name: "Edit Food & dining" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Edit category" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Food & dining");
  });

  it("asks before deleting a category and names where its transactions go", async () => {
    const user = userEvent.setup();
    render(<CategoriesView />);

    await user.click(
      screen.getByRole("button", { name: "Delete Food & dining" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Delete this category?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '2 transactions will move to "Housing" before "Food & dining" is removed.',
      ),
    ).toBeInTheDocument();
    expect(mockReassignTransactions).not.toHaveBeenCalled();
    expect(mockDeleteCategory).not.toHaveBeenCalled();
  });

  it("reassigns a category's transactions before deleting it", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mockUseUserData.mockReturnValue(readyState(DATA, reload));
    render(<CategoriesView />);

    await user.click(
      screen.getByRole("button", { name: "Delete Food & dining" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(mockDeleteCategory).toHaveBeenCalledWith("cat-food"),
    );
    expect(mockReassignTransactions).toHaveBeenCalledWith(
      "cat-food",
      "cat-housing",
    );
    expect(reload).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      'Deleted "Food & dining" · 2 transactions moved to "Housing".',
    );
  });

  it("deletes an unused category without touching any transactions", async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    mockUseUserData.mockReturnValue(
      readyState({
        ...DATA,
        categories: [
          ...DATA.categories,
          {
            id: "cat-fun",
            name: "Entertainment",
            color: "#db2777",
            kind: "expense",
          },
        ],
      }, reload),
    );
    render(<CategoriesView />);

    await user.click(
      screen.getByRole("button", { name: "Delete Entertainment" }),
    );

    expect(
      screen.getByText(
        'No transactions use "Entertainment", so it can be removed safely.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(mockDeleteCategory).toHaveBeenCalledWith("cat-fun"),
    );
    expect(mockReassignTransactions).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      'Deleted "Entertainment".',
    );
  });

  it("refuses to delete the last category of its kind while it is in use", async () => {
    const user = userEvent.setup();
    mockUseUserData.mockReturnValue(
      readyState({ ...DATA, categories: [DATA.categories[2]] }),
    );
    render(<CategoriesView />);

    await user.click(
      screen.getByRole("button", { name: "Delete Food & dining" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      '"Food & dining" is used by 2 transactions and there is no other expense category to move them to. Add one first.',
    );
    expect(mockDeleteCategory).not.toHaveBeenCalled();
  });

  it("keeps the category when the delete is backed out of", async () => {
    const user = userEvent.setup();
    render(<CategoriesView />);

    await user.click(
      screen.getByRole("button", { name: "Delete Food & dining" }),
    );
    await user.click(screen.getByRole("button", { name: "Keep it" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockReassignTransactions).not.toHaveBeenCalled();
    expect(mockDeleteCategory).not.toHaveBeenCalled();
    expect(screen.getByText("Food & dining")).toBeInTheDocument();
  });

  it("keeps the dialog open and explains the failure when the reassignment fails", async () => {
    const user = userEvent.setup();
    mockReassignTransactions.mockResolvedValue({
      error: { message: "Failed to reassign transactions" } as unknown as PostgrestError,
    });
    render(<CategoriesView />);

    await user.click(
      screen.getByRole("button", { name: "Delete Food & dining" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Failed to reassign transactions"),
    ).toBeInTheDocument();
    expect(mockDeleteCategory).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "Delete this category?" }),
    ).toBeInTheDocument();
  });
});
