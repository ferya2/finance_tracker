import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { loadUserData } from "./dashboard";
import type { Budget } from "@/types/budget";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";

const { mockListTransactions, mockListCategories, mockListBudgets } = vi.hoisted(
  () => ({
    mockListTransactions: vi.fn(),
    mockListCategories: vi.fn(),
    mockListBudgets: vi.fn(),
  }),
);

vi.mock("./transactions", () => ({ listTransactions: mockListTransactions }));
vi.mock("./categories", () => ({ listCategories: mockListCategories }));
vi.mock("./budgets", () => ({ listBudgets: mockListBudgets }));

const TRANSACTIONS: Transaction[] = [
  {
    id: "txn-1",
    amount: 115000,
    type: "expense",
    categoryId: "cat-housing",
    note: "Rent",
    occurredOn: "2026-09-04",
  },
];

const CATEGORIES: Category[] = [
  { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
];

const BUDGETS: Budget[] = [
  {
    id: "budget-housing",
    categoryId: "cat-housing",
    month: "2026-09",
    limitAmount: 130000,
  },
];

function error(message: string): PostgrestError {
  return { message } as unknown as PostgrestError;
}

beforeEach(() => {
  mockListTransactions.mockReset();
  mockListCategories.mockReset();
  mockListBudgets.mockReset();
  mockListTransactions.mockResolvedValue({ data: TRANSACTIONS, error: null });
  mockListCategories.mockResolvedValue({ data: CATEGORIES, error: null });
  mockListBudgets.mockResolvedValue({ data: BUDGETS, error: null });
});

describe("loadUserData", () => {
  it("fetches all three lists in parallel and returns the combined data", async () => {
    const result = await loadUserData();

    expect(mockListTransactions).toHaveBeenCalledOnce();
    expect(mockListCategories).toHaveBeenCalledOnce();
    expect(mockListBudgets).toHaveBeenCalledOnce();
    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      transactions: TRANSACTIONS,
      categories: CATEGORIES,
      budgets: BUDGETS,
    });
  });

  it("handles empty lists by returning empty arrays", async () => {
    mockListTransactions.mockResolvedValue({ data: null, error: null });
    mockListCategories.mockResolvedValue({ data: null, error: null });
    mockListBudgets.mockResolvedValue({ data: null, error: null });

    const result = await loadUserData();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      transactions: [],
      categories: [],
      budgets: [],
    });
  });

  it("returns null data and the first error when a read fails", async () => {
    const dbError = error("Failed to fetch budgets");
    mockListBudgets.mockResolvedValue({ data: null, error: dbError });

    const result = await loadUserData();

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});