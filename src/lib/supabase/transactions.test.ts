import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { createTransaction, listTransactions } from "./transactions";
import type { Transaction } from "@/types/transaction";

const { mockCreateClient, mockFrom } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mockCreateClient,
}));

const ROWS = [
  {
    id: "txn-1",
    amount: 115000,
    type: "expense",
    category_id: "cat-housing",
    note: "Rent",
    occurred_on: "2026-09-04",
  },
  {
    id: "txn-2",
    amount: 240000,
    type: "income",
    category_id: "cat-salary",
    note: null,
    occurred_on: "2026-09-01",
  },
];

const MAPPED: Transaction[] = [
  {
    id: "txn-1",
    amount: 115000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-09-04",
  },
  {
    id: "txn-2",
    amount: 240000,
    type: "income",
    categoryId: "cat-salary",
    occurredOn: "2026-09-01",
  },
];

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  mockCreateClient.mockReset();
  mockFrom.mockReset();
  mockCreateClient.mockReturnValue({ from: mockFrom });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function error(message: string): PostgrestError {
  return { message } as unknown as PostgrestError;
}

describe("listTransactions", () => {
  it("returns the user's transactions mapped to the app type, newest first", async () => {
    const order = vi.fn().mockResolvedValue({ data: ROWS, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order,
    });

    const result = await listTransactions();

    expect(mockFrom).toHaveBeenCalledWith("transactions");
    expect(order).toHaveBeenCalledWith("occurred_on", { ascending: false });
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED);
  });

  it("returns null data and the error when the query fails", async () => {
    const dbError = error("Failed to fetch transactions");
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await listTransactions();

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("createTransaction", () => {
  it("inserts a snake_case row and returns the saved transaction", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: ROWS[0], error: null });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single,
    });

    const result = await createTransaction({
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: "2026-09-04",
    });

    expect(mockFrom).toHaveBeenCalledWith("transactions");
    expect(mockFrom().insert).toHaveBeenCalledWith([
      {
        amount: 115000,
        type: "expense",
        category_id: "cat-housing",
        note: "Rent",
        occurred_on: "2026-09-04",
      },
    ]);
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED[0]);
  });

  it("omits the note when none is provided", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: ROWS[1], error: null });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single,
    });

    const result = await createTransaction({
      amount: 240000,
      type: "income",
      categoryId: "cat-salary",
      occurredOn: "2026-09-01",
    });

    expect(mockFrom().insert).toHaveBeenCalledWith([
      {
        amount: 240000,
        type: "income",
        category_id: "cat-salary",
        occurred_on: "2026-09-01",
      },
    ]);
    expect(result.data?.note).toBeUndefined();
    expect(result.data).toEqual(MAPPED[1]);
  });

  it("returns null data and the error when the insert fails", async () => {
    const dbError = error("Failed to insert transaction");
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await createTransaction({
      amount: 1000,
      type: "expense",
      categoryId: "cat-food",
      occurredOn: "2026-09-18",
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});