import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { ImportCsvModal } from "./import-csv-modal";
import type { Category } from "@/types/category";

const { mockCreateTransactions } = vi.hoisted(() => ({
  mockCreateTransactions: vi.fn(),
}));

vi.mock("@/lib/supabase/transactions", () => ({
  createTransactions: mockCreateTransactions,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const CATEGORIES: Category[] = [
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
];

const VALID_CSV = [
  "Date,Type,Category,Note,Amount",
  "2026-09-15,expense,Food & dining,Weekly groceries,86.35",
  "2026-09-01,income,Salary,Monthly salary,2400.00",
].join("\r\n");

function csvFile(contents: string, name = "transactions.csv"): File {
  return new File([contents], name, { type: "text/csv" });
}

function renderModal(
  overrides: Partial<{
    onClose: () => void;
    onImported: (count: number) => void;
  }> = {},
) {
  const onClose = overrides.onClose ?? vi.fn();
  const onImported = overrides.onImported ?? vi.fn();

  render(
    <ImportCsvModal
      categories={CATEGORIES}
      onClose={onClose}
      onImported={onImported}
    />,
  );

  return { onClose, onImported };
}

beforeEach(() => {
  stubMatchMedia(true);
  mockCreateTransactions.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ImportCsvModal", () => {
  it("previews the valid rows and skips the ones it cannot use", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.upload(
      screen.getByLabelText("Choose CSV file"),
      csvFile(
        [
          "Date,Type,Category,Note,Amount",
          "2026-09-15,expense,Food & dining,Weekly groceries,86.35",
          "2026-09-16,expense,Groceries,Unknown category,10.00",
        ].join("\r\n"),
      ),
    );

    expect(
      await screen.findByText("1 transaction ready to import · 1 row skipped"),
    ).toBeInTheDocument();
    expect(screen.getByText("Line 3:")).toBeInTheDocument();
    expect(
      screen.getByText('No category named "Groceries".'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Import 1" }),
    ).toBeEnabled();
  });

  it("imports the valid rows in one batch and reports the count", async () => {
    const user = userEvent.setup();
    const onImported = vi.fn();
    mockCreateTransactions.mockResolvedValue({
      data: [
        {
          id: "txn-1",
          amount: 8635,
          type: "expense",
          categoryId: "cat-food",
          note: "Weekly groceries",
          occurredOn: "2026-09-15",
        },
        {
          id: "txn-2",
          amount: 240000,
          type: "income",
          categoryId: "cat-salary",
          note: "Monthly salary",
          occurredOn: "2026-09-01",
        },
      ],
      error: null,
    });
    renderModal({ onImported });

    await user.upload(
      screen.getByLabelText("Choose CSV file"),
      csvFile(VALID_CSV),
    );
    await user.click(
      await screen.findByRole("button", { name: "Import 2" }),
    );

    await waitFor(() => expect(onImported).toHaveBeenCalledWith(2));
    expect(mockCreateTransactions).toHaveBeenCalledWith([
      {
        amount: 8635,
        type: "expense",
        categoryId: "cat-food",
        note: "Weekly groceries",
        occurredOn: "2026-09-15",
      },
      {
        amount: 240000,
        type: "income",
        categoryId: "cat-salary",
        note: "Monthly salary",
        occurredOn: "2026-09-01",
      },
    ]);
  });

  it("keeps the preview and explains a failed import", async () => {
    const user = userEvent.setup();
    const onImported = vi.fn();
    mockCreateTransactions.mockResolvedValue({
      data: null,
      error: { message: "Failed to insert transactions" } as unknown as PostgrestError,
    });
    renderModal({ onImported });

    await user.upload(
      screen.getByLabelText("Choose CSV file"),
      csvFile(VALID_CSV),
    );
    await user.click(
      await screen.findByRole("button", { name: "Import 2" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to insert transactions",
    );
    expect(onImported).not.toHaveBeenCalled();
    expect(
      screen.getByText("2 transactions ready to import"),
    ).toBeInTheDocument();
  });

  it("disables the import button until a file has valid rows", async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();

    await user.upload(screen.getByLabelText("Choose CSV file"), csvFile(""));

    expect(
      await screen.findByText(/No valid rows found/),
    ).toBeInTheDocument();
    expect(screen.getByText("The file is empty.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import" })).toBeDisabled();
  });

  it("closes when the cancel button is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
