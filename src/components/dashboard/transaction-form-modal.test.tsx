import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { TransactionFormModal } from "./transaction-form-modal";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";

const { mockCreateTransaction, mockUpdateTransaction } = vi.hoisted(() => ({
  mockCreateTransaction: vi.fn(),
  mockUpdateTransaction: vi.fn(),
}));

vi.mock("@/lib/supabase/transactions", () => ({
  createTransaction: mockCreateTransaction,
  updateTransaction: mockUpdateTransaction,
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

const EXISTING: Transaction = {
  id: "txn-1",
  amount: 8635,
  type: "expense",
  categoryId: "cat-food",
  note: "Weekly groceries",
  occurredOn: "2026-09-28",
};

const CORRECTED: Transaction = {
  ...EXISTING,
  amount: 9500,
  note: "Weekly groceries and household",
};

function setup(
  overrides: Partial<{
    categories: readonly Category[];
    referenceDate: string;
    transaction: Transaction;
  }> = {},
) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <TransactionFormModal
      categories={CATEGORIES}
      referenceDate={TODAY}
      onClose={onClose}
      onSaved={onSaved}
      {...overrides}
    />,
  );
  return { onClose, onSaved };
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
  mockUpdateTransaction.mockReset();
  mockUpdateTransaction.mockResolvedValue({ data: CORRECTED, error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TransactionFormModal", () => {
  describe("adding a transaction", () => {
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
        <TransactionFormModal
          categories={CATEGORIES}
          referenceDate={TODAY}
          onClose={vi.fn()}
          onSaved={vi.fn()}
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
      const { onSaved } = setup();

      await fillValidExpense(user);
      await user.click(screen.getByRole("button", { name: "Save transaction" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(SAVED));
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
      const { onSaved } = setup();

      await user.type(screen.getByLabelText("Amount"), "20");
      await user.selectOptions(screen.getByLabelText("Category"), "cat-housing");
      await user.click(screen.getByRole("button", { name: "Save transaction" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
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
      const { onSaved } = setup();

      await fillValidExpense(user);
      await user.click(screen.getByRole("button", { name: "Save transaction" }));

      expect(
        await screen.findByText("Failed to insert transaction"),
      ).toBeInTheDocument();
      expect(onSaved).not.toHaveBeenCalled();
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

  describe("editing a transaction", () => {
    it("opens prefilled from the saved transaction", () => {
      setup({ transaction: EXISTING });

      expect(
        screen.getByRole("dialog", { name: "Edit transaction" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Correct the saved transaction."),
      ).toBeInTheDocument();
      // Cents come back as a plain editable decimal, not "$86.35".
      expect(screen.getByLabelText("Amount")).toHaveValue("86.35");
      expect(screen.getByLabelText("Category")).toHaveValue("cat-food");
      expect(screen.getByLabelText("Note")).toHaveValue("Weekly groceries");
      // The saved day, not today.
      expect(screen.getByLabelText("Date")).toHaveValue("2026-09-28");
      expect(screen.getByRole("button", { name: "Expense" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("prefills a whole amount without redundant decimals", () => {
      setup({ transaction: { ...EXISTING, amount: 240000 } });

      expect(screen.getByLabelText("Amount")).toHaveValue("2400");
    });

    it("prefills an empty note for a transaction that has none", () => {
      setup({
        transaction: {
          id: "txn-1",
          amount: 8635,
          type: "expense",
          categoryId: "cat-food",
          occurredOn: "2026-09-28",
        },
      });

      expect(screen.getByLabelText("Note")).toHaveValue("");
    });

    it("saves the correction to that transaction and hands the saved row back", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup({ transaction: EXISTING });

      await user.clear(screen.getByLabelText("Amount"));
      await user.type(screen.getByLabelText("Amount"), "95");
      await user.clear(screen.getByLabelText("Note"));
      await user.type(screen.getByLabelText("Note"), "Weekly groceries and household");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(CORRECTED));
      expect(mockUpdateTransaction).toHaveBeenCalledWith("txn-1", {
        amount: 9500,
        type: "expense",
        categoryId: "cat-food",
        note: "Weekly groceries and household",
        occurredOn: "2026-09-28",
      });
      expect(mockCreateTransaction).not.toHaveBeenCalled();
    });

    it("clears the saved note when the field is emptied", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup({ transaction: EXISTING });

      await user.clear(screen.getByLabelText("Note"));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      // Sent as an empty string so the saved note is cleared, not left alone.
      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        "txn-1",
        expect.objectContaining({ note: "" }),
      );
    });

    it("re-categorises and re-dates the transaction", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup({ transaction: EXISTING });

      await user.selectOptions(screen.getByLabelText("Category"), "cat-housing");
      await user.clear(screen.getByLabelText("Date"));
      await user.type(screen.getByLabelText("Date"), "2026-10-01");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        "txn-1",
        expect.objectContaining({
          categoryId: "cat-housing",
          occurredOn: "2026-10-01",
        }),
      );
    });

    it("reports an edit the user left invalid and saves nothing", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup({ transaction: EXISTING });

      await user.clear(screen.getByLabelText("Amount"));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(
        screen.getByText("Amount must be a positive whole number of cents."),
      ).toBeInTheDocument();
      expect(mockUpdateTransaction).not.toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
    });

    it("asks for a category when the saved one is no longer on offer", async () => {
      const user = userEvent.setup();
      setup({
        transaction: EXISTING,
        categories: CATEGORIES.filter((category) => category.id !== "cat-food"),
      });

      // Not silently holding an id that is not on screen.
      expect(screen.getByLabelText("Category")).toHaveValue("");

      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(screen.getByText("Category is required.")).toBeInTheDocument();
      expect(mockUpdateTransaction).not.toHaveBeenCalled();
    });

    it("keeps the form open and explains the failure when the update fails", async () => {
      const user = userEvent.setup();
      mockUpdateTransaction.mockResolvedValue({
        data: null,
        error: { message: "Failed to update transaction" } as unknown as PostgrestError,
      });
      const { onSaved } = setup({ transaction: EXISTING });

      await user.clear(screen.getByLabelText("Amount"));
      await user.type(screen.getByLabelText("Amount"), "95");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(
        await screen.findByText("Failed to update transaction"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("dialog", { name: "Edit transaction" }),
      ).toBeInTheDocument();
      expect(onSaved).not.toHaveBeenCalled();
    });
  });
});
