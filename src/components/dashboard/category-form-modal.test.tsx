import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { CategoryFormModal } from "./category-form-modal";
import type { Category } from "@/types/category";

const { mockCreateCategory, mockUpdateCategory } = vi.hoisted(() => ({
  mockCreateCategory: vi.fn(),
  mockUpdateCategory: vi.fn(),
}));

vi.mock("@/lib/supabase/categories", () => ({
  createCategory: mockCreateCategory,
  updateCategory: mockUpdateCategory,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const EXISTING: Category = {
  id: "cat-food",
  name: "Food & dining",
  color: "#e11d48",
  kind: "expense",
};

const CREATED: Category = {
  id: "cat-new",
  name: "Groceries",
  color: "#2563eb",
  kind: "income",
};

const UPDATED: Category = {
  ...EXISTING,
  name: "Dining out",
  color: "#2563eb",
};

function setup(overrides: Partial<{ category: Category }> = {}) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(
    <CategoryFormModal onClose={onClose} onSaved={onSaved} {...overrides} />,
  );
  return { onClose, onSaved };
}

beforeEach(() => {
  // Reduced motion is stubbed on so entrances and exits land without a transition.
  stubMatchMedia(true);
  mockCreateCategory.mockReset();
  mockCreateCategory.mockResolvedValue({ data: CREATED, error: null });
  mockUpdateCategory.mockReset();
  mockUpdateCategory.mockResolvedValue({ data: UPDATED, error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CategoryFormModal", () => {
  describe("creating a category", () => {
    it("opens blank as an expense on the first palette colour and focuses the name", () => {
      setup();

      expect(
        screen.getByRole("dialog", { name: "New category" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toHaveValue("");
      expect(screen.getByRole("button", { name: "Expense" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(
        screen.getByRole("button", { name: "Colour #e11d48" }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByLabelText("Name")).toHaveFocus();
    });

    it("keeps the page behind it from scrolling while it is open", () => {
      const { unmount } = render(
        <CategoryFormModal onClose={vi.fn()} onSaved={vi.fn()} />,
      );

      expect(document.body.style.overflow).toBe("hidden");

      unmount();

      expect(document.body.style.overflow).not.toBe("hidden");
    });

    it("requires a name and saves nothing", async () => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByRole("button", { name: "Create category" }));

      expect(screen.getByText("Name is required.")).toBeInTheDocument();
      expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it("saves a valid category and hands the saved row back", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup();

      await user.type(screen.getByLabelText("Name"), "Groceries");
      await user.click(screen.getByRole("button", { name: "Income" }));
      await user.click(screen.getByRole("button", { name: "Colour #2563eb" }));
      await user.click(screen.getByRole("button", { name: "Create category" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(CREATED));
      expect(mockCreateCategory).toHaveBeenCalledWith({
        name: "Groceries",
        kind: "income",
        color: "#2563eb",
      });
    });

    it("saves the default colour when the user leaves it alone", async () => {
      const user = userEvent.setup();
      setup();

      await user.type(screen.getByLabelText("Name"), "Transport");
      await user.click(screen.getByRole("button", { name: "Create category" }));

      await waitFor(() =>
        expect(mockCreateCategory).toHaveBeenCalledWith({
          name: "Transport",
          kind: "expense",
          color: "#e11d48",
        }),
      );
    });

    it("shows the failure when the save does not go through", async () => {
      const user = userEvent.setup();
      mockCreateCategory.mockResolvedValue({
        data: null,
        error: { message: "Failed to insert category" } as unknown as PostgrestError,
      });
      const { onSaved } = setup();

      await user.type(screen.getByLabelText("Name"), "Groceries");
      await user.click(screen.getByRole("button", { name: "Create category" }));

      expect(
        await screen.findByText("Failed to insert category"),
      ).toBeInTheDocument();
      expect(onSaved).not.toHaveBeenCalled();
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

  describe("editing a category", () => {
    it("opens prefilled from the saved category", () => {
      setup({ category: EXISTING });

      expect(
        screen.getByRole("dialog", { name: "Edit category" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toHaveValue("Food & dining");
      expect(screen.getByRole("button", { name: "Expense" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(
        screen.getByRole("button", { name: "Colour #e11d48" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("saves the correction to that category and hands the saved row back", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup({ category: EXISTING });

      await user.clear(screen.getByLabelText("Name"));
      await user.type(screen.getByLabelText("Name"), "Dining out");
      await user.click(screen.getByRole("button", { name: "Colour #2563eb" }));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(UPDATED));
      expect(mockUpdateCategory).toHaveBeenCalledWith("cat-food", {
        name: "Dining out",
        kind: "expense",
        color: "#2563eb",
      });
      expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it("reports an edit the user left invalid and saves nothing", async () => {
      const user = userEvent.setup();
      const { onSaved } = setup({ category: EXISTING });

      await user.clear(screen.getByLabelText("Name"));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(screen.getByText("Name is required.")).toBeInTheDocument();
      expect(mockUpdateCategory).not.toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
    });
  });
});
