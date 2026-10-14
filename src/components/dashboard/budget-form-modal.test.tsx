import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { BudgetFormModal } from "./budget-form-modal";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";

const { mockCreateBudget, mockUpdateBudget } = vi.hoisted(() => ({
  mockCreateBudget: vi.fn(),
  mockUpdateBudget: vi.fn(),
}));

vi.mock("@/lib/supabase/budgets", () => ({
  createBudget: mockCreateBudget,
  updateBudget: mockUpdateBudget,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const PERIOD = { year: 2026, month: 10 };

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
];

const EXISTING: Budget = {
  id: "bud-1",
  categoryId: "cat-food",
  month: "2026-10",
  limitAmount: 50000,
};

const CREATED: Budget = {
  id: "bud-new",
  categoryId: "cat-housing",
  month: "2026-10",
  limitAmount: 120000,
};

const UPDATED: Budget = {
  ...EXISTING,
  limitAmount: 65000,
};

function setup(
  overrides: Partial<{ budget: Budget }> = {},
) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <BudgetFormModal
      categories={CATEGORIES}
      period={PERIOD}
      onClose={onClose}
      onSaved={onSaved}
      {...overrides}
    />,
  );
  return { onClose, onSaved };
}

beforeEach(() => {
  stubMatchMedia(true);
  mockCreateBudget.mockReset();
  mockCreateBudget.mockResolvedValue({ data: CREATED, error: null });
  mockUpdateBudget.mockReset();
  mockUpdateBudget.mockResolvedValue({ data: UPDATED, error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BudgetFormModal", () => {
  describe("setting a budget", () => {
    it("opens blank on the given month and focuses the limit", () => {
      setup();

      expect(
        screen.getByRole("dialog", { name: "Set budget" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Category")).toHaveValue("");
      expect(screen.getByLabelText("Month")).toHaveValue("2026-10");
      expect(screen.getByLabelText("Monthly limit")).toHaveValue("");
      expect(screen.getByLabelText("Monthly limit")).toHaveFocus();
    });

    it("only offers expense categories", () => {
      setup();

      expect(
        screen.getByRole("option", { name: "Food & dining" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Housing" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: "Salary" }),
      ).not.toBeInTheDocument();
    });

    it("requires a category and a positive limit, saving nothing", async () => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByRole("button", { name: "Set budget" }));

      expect(screen.getByText("Category is required.")).toBeInTheDocument();
      expect(
        screen.getByText("Amount must be a positive whole number of cents."),
      ).toBeInTheDocument();
      expect(mockCreateBudget).not.toHaveBeenCalled();
    });

    it("saves a valid budget and hands the saved row back", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup();

      await user.selectOptions(screen.getByLabelText("Category"), "cat-housing");
      await user.type(screen.getByLabelText("Monthly limit"), "1200.00");
      await user.click(screen.getByRole("button", { name: "Set budget" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(CREATED));
      expect(mockCreateBudget).toHaveBeenCalledWith({
        categoryId: "cat-housing",
        month: "2026-10",
        limitAmount: 120000,
      });
    });

    it("shows the failure when the save does not go through", async () => {
      const user = userEvent.setup();
      mockCreateBudget.mockResolvedValue({
        data: null,
        error: { message: "Failed to insert budget" } as unknown as PostgrestError,
      });
      const { onSaved } = setup();

      await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
      await user.type(screen.getByLabelText("Monthly limit"), "500");
      await user.click(screen.getByRole("button", { name: "Set budget" }));

      expect(
        await screen.findByText("Failed to insert budget"),
      ).toBeInTheDocument();
      expect(onSaved).not.toHaveBeenCalled();
    });

    it("keeps the page behind it from scrolling while it is open", () => {
      const { unmount } = render(
        <BudgetFormModal
          categories={CATEGORIES}
          period={PERIOD}
          onClose={vi.fn()}
          onSaved={vi.fn()}
        />,
      );

      expect(document.body.style.overflow).toBe("hidden");

      unmount();

      expect(document.body.style.overflow).not.toBe("hidden");
    });

    it("closes on Escape, on Cancel and on the close button", async () => {
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

  describe("editing a budget", () => {
    it("opens prefilled from the saved budget", () => {
      setup({ budget: EXISTING });

      expect(
        screen.getByRole("dialog", { name: "Edit budget" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Category")).toHaveValue("cat-food");
      expect(screen.getByLabelText("Month")).toHaveValue("2026-10");
      expect(screen.getByLabelText("Monthly limit")).toHaveValue("500");
    });

    it("saves the correction to that budget and hands the saved row back", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup({ budget: EXISTING });

      await user.clear(screen.getByLabelText("Monthly limit"));
      await user.type(screen.getByLabelText("Monthly limit"), "650.00");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(UPDATED));
      expect(mockUpdateBudget).toHaveBeenCalledWith("bud-1", {
        categoryId: "cat-food",
        month: "2026-10",
        limitAmount: 65000,
      });
      expect(mockCreateBudget).not.toHaveBeenCalled();
    });

    it("reports an edit the user left invalid and saves nothing", async () => {
      const user = userEvent.setup();
      setup({ budget: EXISTING });

      await user.clear(screen.getByLabelText("Monthly limit"));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(
        screen.getByText("Amount must be a positive whole number of cents."),
      ).toBeInTheDocument();
      expect(mockUpdateBudget).not.toHaveBeenCalled();
    });
  });
});
