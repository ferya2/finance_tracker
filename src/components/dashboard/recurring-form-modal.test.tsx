import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecurringFormModal } from "./recurring-form-modal";
import type { Category } from "@/types/category";
import type { RecurringTransaction } from "@/types/recurring";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const CATEGORIES: Category[] = [
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
];

const EXISTING: RecurringTransaction = {
  id: "rec-1",
  amount: 120000,
  type: "expense",
  categoryId: "cat-housing",
  note: "Rent",
  startOn: "2026-10-01",
  frequency: "monthly",
  interval: 1,
  endOn: "2027-10-01",
};

function setup(overrides: Partial<{ recurring: RecurringTransaction }> = {}) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <RecurringFormModal
      categories={CATEGORIES}
      referenceDate="2026-10-15"
      onClose={onClose}
      onSaved={onSaved}
      {...overrides}
    />,
  );
  return { onClose, onSaved };
}

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RecurringFormModal", () => {
  describe("creating a plan", () => {
    it("opens blank on the reference day as a monthly expense", () => {
      setup();

      expect(
        screen.getByRole("dialog", { name: "New recurring plan" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Amount")).toHaveValue("");
      expect(screen.getByLabelText("Category")).toHaveValue("");
      expect(screen.getByLabelText("First occurrence")).toHaveValue(
        "2026-10-15",
      );
      expect(screen.getByLabelText("Frequency")).toHaveValue("monthly");
      expect(screen.getByLabelText("Repeat every")).toHaveValue(1);
      expect(screen.getByLabelText(/End date/)).toHaveValue("");
      expect(screen.getByLabelText("Amount")).toHaveFocus();
    });

    it("only offers categories matching the selected type", async () => {
      const user = userEvent.setup();
      setup();

      expect(
        screen.getByRole("option", { name: "Food & dining" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: "Salary" }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Income" }));

      expect(
        screen.getByRole("option", { name: "Salary" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: "Food & dining" }),
      ).not.toBeInTheDocument();
    });

    it("requires an amount and a category, saving nothing", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup();

      await user.click(screen.getByRole("button", { name: "Create plan" }));

      expect(
        screen.getByText("Amount must be a positive whole number of cents."),
      ).toBeInTheDocument();
      expect(screen.getByText("Category is required.")).toBeInTheDocument();
      expect(onSaved).not.toHaveBeenCalled();
    });

    it("saves a valid plan with parsed values", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup();

      await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
      await user.type(screen.getByLabelText("Amount"), "1,234.56");
      await user.type(screen.getByLabelText(/Note/), "  Groceries  ");
      await user.selectOptions(screen.getByLabelText("Frequency"), "weekly");
      await user.clear(screen.getByLabelText("Repeat every"));
      await user.type(screen.getByLabelText("Repeat every"), "2");
      await user.click(screen.getByRole("button", { name: "Create plan" }));

      expect(onSaved).toHaveBeenCalledWith({
        amount: 123456,
        type: "expense",
        categoryId: "cat-food",
        note: "Groceries",
        startOn: "2026-10-15",
        frequency: "weekly",
        interval: 2,
      });
    });

    it("rejects an end date before the start date", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup();

      await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
      await user.type(screen.getByLabelText("Amount"), "10");
      fireEvent.change(screen.getByLabelText(/End date/), {
        target: { value: "2026-10-01" },
      });
      await user.click(screen.getByRole("button", { name: "Create plan" }));

      expect(
        screen.getByText("End date cannot be before the start date."),
      ).toBeInTheDocument();
      expect(onSaved).not.toHaveBeenCalled();
    });

    it("closes on Escape, Cancel and the close button", async () => {
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

  describe("editing a plan", () => {
    it("opens prefilled from the saved plan", () => {
      setup({ recurring: EXISTING });

      expect(
        screen.getByRole("dialog", { name: "Edit recurring plan" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Amount")).toHaveValue("1200");
      expect(screen.getByLabelText("Category")).toHaveValue("cat-housing");
      expect(screen.getByLabelText(/Note/)).toHaveValue("Rent");
      expect(screen.getByLabelText("First occurrence")).toHaveValue(
        "2026-10-01",
      );
      expect(screen.getByLabelText("Frequency")).toHaveValue("monthly");
      expect(screen.getByLabelText(/End date/)).toHaveValue("2027-10-01");
    });

    it("hands the corrected values back", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup({ recurring: EXISTING });

      await user.clear(screen.getByLabelText("Amount"));
      await user.type(screen.getByLabelText("Amount"), "1300");
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(onSaved).toHaveBeenCalledWith({
        amount: 130000,
        type: "expense",
        categoryId: "cat-housing",
        note: "Rent",
        startOn: "2026-10-01",
        frequency: "monthly",
        interval: 1,
        endOn: "2027-10-01",
      });
    });
  });
});
