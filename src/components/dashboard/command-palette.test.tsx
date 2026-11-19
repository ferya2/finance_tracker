import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { CommandPalette } from "./command-palette";
import { USER_DATA_CHANGED_EVENT } from "@/components/use-user-data";

const { mockPush, mockListCategories, mockCreateTransaction } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockListCategories: vi.fn(),
  mockCreateTransaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/supabase/categories", () => ({
  listCategories: mockListCategories,
}));

vi.mock("@/lib/supabase/transactions", () => ({
  createTransaction: mockCreateTransaction,
}));

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

async function openPalette() {
  const user = userEvent.setup();
  render(<CommandPalette />);
  await user.keyboard("{Control>}k{/Control}");
  const dialog = await screen.findByRole("dialog", { name: "Command palette" });
  return { user, dialog };
}

beforeEach(() => {
  stubMatchMedia(true);
  mockPush.mockReset();
  mockListCategories.mockReset();
  mockCreateTransaction.mockReset();
  mockListCategories.mockResolvedValue({
    data: [
      { id: "cat-food", name: "Groceries", color: "#22c55e", kind: "expense" },
      { id: "cat-pay", name: "Salary", color: "#3b82f6", kind: "income" },
    ],
    error: null,
  });
  mockCreateTransaction.mockResolvedValue({
    data: {
      id: "txn-1",
      amount: 1250,
      type: "expense",
      categoryId: "cat-food",
      note: "Lunch",
      occurredOn: "2026-11-19",
    },
    error: null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CommandPalette", () => {
  it("opens with Control+K and navigates to a filtered command", async () => {
    const { user } = await openPalette();

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "budgets");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(
      screen.getByRole("option", { name: /Go to Budgets/ }),
    ).toBeInTheDocument();

    await user.keyboard("{Enter}");

    expect(mockPush).toHaveBeenCalledWith("/dashboard/budgets");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Command palette" })).toBeNull(),
    );
  });

  it("supports arrow-key selection and Escape", async () => {
    const { user } = await openPalette();

    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");

    await user.keyboard("{Control>}k{/Control}");
    await screen.findByRole("dialog", { name: "Command palette" });
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Command palette" })).toBeNull(),
    );
  });

  it("shows an empty result for an unmatched query", async () => {
    const { user } = await openPalette();

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "pizza");

    expect(screen.getByText("No commands found.")).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("validates a quick add before writing anything", async () => {
    const { user } = await openPalette();

    await user.click(screen.getByRole("button", { name: /Add transaction/ }));
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(screen.getByText("Amount must be a positive whole number of cents.")).toBeInTheDocument();
    expect(screen.getByText("Category is required.")).toBeInTheDocument();
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("saves a quick transaction, announces it and refreshes dashboard data", async () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    const { user } = await openPalette();

    await user.click(screen.getByRole("button", { name: /Add transaction/ }));
    await user.type(await screen.findByLabelText("Amount"), "12.50");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.type(screen.getByLabelText(/Note/), "Lunch");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() =>
      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 1250, categoryId: "cat-food", note: "Lunch" }),
      ),
    );
    expect(
      dispatch.mock.calls.some(([event]) => event.type === USER_DATA_CHANGED_EVENT),
    ).toBe(true);
    expect(await screen.findByRole("status")).toHaveTextContent("Transaction added");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Command palette" })).toBeNull(),
    );
  });

  it("keeps the form open and shows the error when saving fails", async () => {
    mockCreateTransaction.mockResolvedValue({
      data: null,
      error: { message: "Insert blocked" } as unknown as PostgrestError,
    });
    const { user } = await openPalette();

    await user.click(screen.getByRole("button", { name: /Add transaction/ }));
    await user.type(await screen.findByLabelText("Amount"), "8");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(await screen.findByText("Insert blocked")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
  });
});
