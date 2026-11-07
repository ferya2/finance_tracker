import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReceiptModal } from "./receipt-modal";
import type { Transaction } from "@/types/transaction";

const {
  mockListReceipts,
  mockGetReceiptUrls,
  mockUploadReceipt,
  mockDeleteReceipt,
} = vi.hoisted(() => ({
  mockListReceipts: vi.fn(),
  mockGetReceiptUrls: vi.fn(),
  mockUploadReceipt: vi.fn(),
  mockDeleteReceipt: vi.fn(),
}));

vi.mock("@/lib/supabase/receipts", () => ({
  listReceipts: mockListReceipts,
  getReceiptUrls: mockGetReceiptUrls,
  uploadReceipt: mockUploadReceipt,
  deleteReceipt: mockDeleteReceipt,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const TRANSACTION: Transaction = {
  id: "txn-1",
  amount: 8635,
  type: "expense",
  categoryId: "cat-food",
  note: "Weekly groceries",
  occurredOn: "2026-10-15",
};

const RECEIPT = {
  path: "user-1/txn-1/1700000000000-lunch-receipt.jpg",
  fileName: "lunch-receipt.jpg",
  size: 2048,
  contentType: "image/jpeg",
  createdAt: "2023-11-14T22:13:20.000Z",
};

beforeEach(() => {
  stubMatchMedia(true);
  mockListReceipts.mockReset();
  mockListReceipts.mockResolvedValue({ data: [], error: null });
  mockGetReceiptUrls.mockReset();
  mockGetReceiptUrls.mockResolvedValue({ data: {}, error: null });
  mockUploadReceipt.mockReset();
  mockUploadReceipt.mockResolvedValue({ data: RECEIPT, error: null });
  mockDeleteReceipt.mockReset();
  mockDeleteReceipt.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReceiptModal", () => {
  it("loads and shows the transaction's receipts", async () => {
    mockListReceipts.mockResolvedValue({ data: [RECEIPT], error: null });

    render(
      <ReceiptModal
        transaction={TRANSACTION}
        userId="user-1"
        onClose={vi.fn()}
      />,
    );

    expect(
      await screen.findByText("lunch-receipt.jpg"),
    ).toBeInTheDocument();
    expect(mockListReceipts).toHaveBeenCalledWith("user-1", "txn-1");
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
  });

  it("uploads a valid receipt image and refreshes the list", async () => {
    const onChanged = vi.fn();
    render(
      <ReceiptModal
        transaction={TRANSACTION}
        userId="user-1"
        onClose={vi.fn()}
        onChanged={onChanged}
      />,
    );

    await screen.findByText("No receipt yet");
    const file = new File(["receipt"], "Lunch Receipt.JPG", {
      type: "image/jpeg",
    });

    fireEvent.change(screen.getByLabelText("Upload receipt image"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(mockUploadReceipt).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          transactionId: "txn-1",
          file,
        }),
      );
    });
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith("Receipt uploaded.");
    });
  });

  it("rejects a file that is not an image before uploading", async () => {
    render(
      <ReceiptModal
        transaction={TRANSACTION}
        userId="user-1"
        onClose={vi.fn()}
      />,
    );

    await screen.findByText("No receipt yet");
    const file = new File(["invoice"], "invoice.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(screen.getByLabelText("Upload receipt image"), {
      target: { files: [file] },
    });

    expect(
      await screen.findByText(
        "Receipts must be a JPG, PNG, WebP, HEIC or HEIF image.",
      ),
    ).toBeInTheDocument();
    expect(mockUploadReceipt).not.toHaveBeenCalled();
  });

  it("removes a receipt after confirming the trash button", async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    mockListReceipts.mockResolvedValue({ data: [RECEIPT], error: null });

    render(
      <ReceiptModal
        transaction={TRANSACTION}
        userId="user-1"
        onClose={vi.fn()}
        onChanged={onChanged}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Remove lunch-receipt.jpg" }),
    );

    expect(mockDeleteReceipt).toHaveBeenCalledWith(RECEIPT.path);
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith("Receipt removed.");
    });
  });

  it("shows an error state when receipts cannot be loaded", async () => {
    mockListReceipts.mockResolvedValue({
      data: null,
      error: { message: "Network down" },
    });

    render(
      <ReceiptModal
        transaction={TRANSACTION}
        userId="user-1"
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText("Network down")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
