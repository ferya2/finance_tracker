import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { AddTransactionModal } from "./add-transaction-modal";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";

const { mockCreateTransaction } = vi.hoisted(() => ({
  mockCreateTransaction: vi.fn(),
}));

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

const TODAY = "2026-10-02";

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
];

const SAVED: Transaction = {
  id: "txn-new",
  amount: 123456,
  type: "expense",
  categoryId: "cat-food",
  note: "Groceries",
  occurredOn: TODAY,
};

function setup(
  overrides: Partial<{ categories: readonly Category[]; referenceDate: string }> = {},
) {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(
    <AddTransactionModal
      categories={CATEGORIES}
      referenceDate={TODAY}
      onClose={onClose}
      onCreated={onCreated}
      {...overrides}
    />,
  );
  return { onClose, onCreated };
}

/** Fill the form with a valid expense. */
async function fillValidExpense(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Amount"), "1234.56");
  await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
  await user.type(screen.getByLabelText("Note"), "Groceries");
}

beforeEach(() => {
  // Reduced motion is stubbed on so entrances and exits land without a transition.
  stubMatchMedia(true);
  mockCreateTransaction.mockReset();
  mockCreateTransaction.mockResolvedValue({ data: SAVED, error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AddTransactionModal", () => {
  it("opens on today's date with an empty expense and focuses the amount", () => {
    setup();

    expect(screen.getByRole("dialog", { name: "Add transaction" })).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toHaveValue("");
    expect(screen.getByLabelText("Category")).toHaveValue("");
    expect(screen.getByLabelText("Date")).toHaveValue(TODAY);
    expect(screen.getByRole("button", { name: "Expense" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Amount")).toHaveFocus();
  });

  it("keeps the page behind it from scrolling while it is open", () => {
    const { unmount } = render(
      <AddTransactionModal
        categories={CATEGORIES}
        referenceDate={TODAY}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("reports every missing field and saves nothing", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(
      screen.getByText("Amount must be a positive whole number of cents."),
    ).toBeInTheDocument();
    expect(screen.getByText("Category is required.")).toBeInTheDocument();
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("reports an unparseable amount", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText("Amount"), "ten");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(
      screen.getByText("Amount must be a positive whole number of cents."),
    ).toBeInTheDocument();
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("saves a valid expense in cents and hands the saved row back", async () => {
    const user = userEvent.setup();
    const { onCreated } = setup();

    await fillValidExpense(user);
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(SAVED));
    expect(mockCreateTransaction).toHaveBeenCalledWith({
      amount: 123456,
      type: "expense",
      categoryId: "cat-food",
      note: "Groceries",
      occurredOn: TODAY,
    });
  });

  it("saves a note-free expense without an empty note", async () => {
    const user = userEvent.setup();
    const { onCreated } = setup();

    await user.type(screen.getByLabelText("Amount"), "20");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-housing");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(mockCreateTransaction).toHaveBeenCalledWith({
      amount: 2000,
      type: "expense",
      categoryId: "cat-housing",
      occurredOn: TODAY,
    });
  });

  it("saves the date the user picked", async () => {
    const user = userEvent.setup();
    setup();

    await user.type(screen.getByLabelText("Amount"), "20");
    await user.selectOptions(screen.getByLabelText("Category"), "cat-housing");
    await user.clear(screen.getByLabelText("Date"));
    await user.type(screen.getByLabelText("Date"), "2026-09-14");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() =>
      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ occurredOn: "2026-09-14" }),
      ),
    );
  });

  it("offers only income categories once the type is switched to income", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Income" }));

    const select = screen.getByLabelText("Category");
    expect(
      Array.from(select.querySelectorAll("option"))
        .map((option) => option.textContent)
        .filter((name) => name !== "Choose a category"),
    ).toEqual(["Salary"]);

    await user.type(screen.getByLabelText("Amount"), "2400");
    await user.selectOptions(select, "cat-salary");
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    await waitFor(() =>
      expect(mockCreateTransaction).toHaveBeenCalledWith({
        amount: 240000,
        type: "income",
        categoryId: "cat-salary",
        occurredOn: TODAY,
      }),
    );
  });

  it("clears a category that no longer fits the chosen type", async () => {
    const user = userEvent.setup();
    setup();

    await user.selectOptions(screen.getByLabelText("Category"), "cat-housing");
    await user.click(screen.getByRole("button", { name: "Income" }));

    expect(screen.getByLabelText("Category")).toHaveValue("");
  });

  it("explains that a category has to exist first", () => {
    setup({ categories: [] });

    expect(screen.queryAllByRole("option")).toHaveLength(1);
    expect(
      screen.getByText(
        "You have no categories yet — create one on the Categories page first.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the failure when the save does not go through", async () => {
    const user = userEvent.setup();
    mockCreateTransaction.mockResolvedValue({
      data: null,
      error: { message: "Failed to insert transaction" } as unknown as PostgrestError,
    });
    const { onCreated } = setup();

    await fillValidExpense(user);
    await user.click(screen.getByRole("button", { name: "Save transaction" }));

    expect(
      await screen.findByText("Failed to insert transaction"),
    ).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("closes on Escape, on the backdrop and on Cancel", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});