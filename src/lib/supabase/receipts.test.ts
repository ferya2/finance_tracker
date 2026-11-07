import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReceiptStorageError } from "./receipts";
import {
  deleteReceipt,
  getReceiptUrls,
  listReceipts,
  RECEIPT_BUCKET,
  RECEIPT_URL_TTL_SECONDS,
  uploadReceipt,
} from "./receipts";

const { mockCreateClient, mockStorageFrom } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockStorageFrom: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mockCreateClient,
}));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  mockCreateClient.mockReset();
  mockStorageFrom.mockReset();
  mockCreateClient.mockReturnValue({
    storage: { from: mockStorageFrom },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function error(message: string): ReceiptStorageError {
  return { message };
}

function receiptFile(name = "Lunch Receipt.JPG", type = "image/jpeg"): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe("uploadReceipt", () => {
  it("uploads the image to the transaction's folder and returns the receipt", async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: "x" }, error: null });
    mockStorageFrom.mockReturnValue({ upload });

    const result = await uploadReceipt({
      userId: "user-1",
      transactionId: "txn-1",
      file: receiptFile(),
      timestamp: 1_700_000_000_000,
    });

    expect(mockStorageFrom).toHaveBeenCalledWith(RECEIPT_BUCKET);
    expect(upload).toHaveBeenCalledWith(
      "user-1/txn-1/1700000000000-lunch-receipt.jpg",
      expect.any(File),
      { contentType: "image/jpeg", upsert: false },
    );
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      path: "user-1/txn-1/1700000000000-lunch-receipt.jpg",
      fileName: "lunch-receipt.jpg",
      size: 3,
      contentType: "image/jpeg",
      createdAt: "2023-11-14T22:13:20.000Z",
    });
  });

  it("adds an extension when the file name has none", async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: "x" }, error: null });
    mockStorageFrom.mockReturnValue({ upload });

    await uploadReceipt({
      userId: "user-1",
      transactionId: "txn-1",
      file: receiptFile("Lunch", "image/png"),
      timestamp: 5,
    });

    expect(upload).toHaveBeenCalledWith(
      "user-1/txn-1/5-lunch.png",
      expect.any(File),
      { contentType: "image/png", upsert: false },
    );
  });

  it("returns the storage error and no receipt when the upload fails", async () => {
    const dbError = error("Bucket not found");
    mockStorageFrom.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await uploadReceipt({
      userId: "user-1",
      transactionId: "txn-1",
      file: receiptFile(),
      timestamp: 1,
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("listReceipts", () => {
  it("lists the transaction's receipts with metadata and paths", async () => {
    const list = vi.fn().mockResolvedValue({
      data: [
        {
          name: "1700000000000-lunch-receipt.jpg",
          created_at: "2023-11-14T22:13:20.000Z",
          metadata: { size: 2048, mimetype: "image/jpeg" },
        },
        {
          name: "folder/",
          created_at: null,
          metadata: null,
        },
      ],
      error: null,
    });
    mockStorageFrom.mockReturnValue({ list });

    const result = await listReceipts("user-1", "txn-1");

    expect(mockStorageFrom).toHaveBeenCalledWith(RECEIPT_BUCKET);
    expect(list).toHaveBeenCalledWith("user-1/txn-1", {
      sortBy: { column: "created_at", order: "desc" },
    });
    expect(result.error).toBeNull();
    expect(result.data).toEqual([
      {
        path: "user-1/txn-1/1700000000000-lunch-receipt.jpg",
        fileName: "lunch-receipt.jpg",
        size: 2048,
        contentType: "image/jpeg",
        createdAt: "2023-11-14T22:13:20.000Z",
      },
    ]);
  });

  it("returns null data and the error when listing fails", async () => {
    const dbError = error("Failed to list");
    mockStorageFrom.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await listReceipts("user-1", "txn-1");

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("getReceiptUrls", () => {
  it("maps paths to their signed URLs", async () => {
    const createSignedUrls = vi.fn().mockResolvedValue({
      data: [
        {
          path: "user-1/txn-1/a.jpg",
          signedUrl: "https://example.supabase.co/signed/a.jpg",
          error: null,
        },
      ],
      error: null,
    });
    mockStorageFrom.mockReturnValue({ createSignedUrls });

    const result = await getReceiptUrls(["user-1/txn-1/a.jpg"]);

    expect(createSignedUrls).toHaveBeenCalledWith(
      ["user-1/txn-1/a.jpg"],
      RECEIPT_URL_TTL_SECONDS,
    );
    expect(result).toEqual({
      data: {
        "user-1/txn-1/a.jpg": "https://example.supabase.co/signed/a.jpg",
      },
      error: null,
    });
  });

  it("skips paths that could not be signed", async () => {
    mockStorageFrom.mockReturnValue({
      createSignedUrls: vi.fn().mockResolvedValue({
        data: [
          { path: "a.jpg", signedUrl: null, error: "missing" },
          { path: "b.jpg", signedUrl: "https://example/signed/b.jpg", error: null },
        ],
        error: null,
      }),
    });

    const result = await getReceiptUrls(["a.jpg", "b.jpg"]);

    expect(result.data).toEqual({ "b.jpg": "https://example/signed/b.jpg" });
  });

  it("does not call Storage when there are no paths", async () => {
    const result = await getReceiptUrls([]);

    expect(result).toEqual({ data: {}, error: null });
    expect(mockStorageFrom).not.toHaveBeenCalled();
  });

  it("returns the error when signing fails", async () => {
    const dbError = error("Failed to sign");
    mockStorageFrom.mockReturnValue({
      createSignedUrls: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await getReceiptUrls(["a.jpg"]);

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("deleteReceipt", () => {
  it("removes the receipt by path", async () => {
    const remove = vi.fn().mockResolvedValue({ data: [], error: null });
    mockStorageFrom.mockReturnValue({ remove });

    const result = await deleteReceipt("user-1/txn-1/a.jpg");

    expect(mockStorageFrom).toHaveBeenCalledWith(RECEIPT_BUCKET);
    expect(remove).toHaveBeenCalledWith(["user-1/txn-1/a.jpg"]);
    expect(result.error).toBeNull();
  });

  it("returns the error when removal fails", async () => {
    const dbError = error("Failed to remove");
    mockStorageFrom.mockReturnValue({
      remove: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await deleteReceipt("user-1/txn-1/a.jpg");

    expect(result.error).toBe(dbError);
  });
});
