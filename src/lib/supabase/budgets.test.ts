import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  createBudget,
  deleteBudget,
  listBudgets,
  updateBudget,
} from "./budgets";
import type { Budget } from "@/types/budget";

const { mockCreateClient, mockFrom } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mockCreateClient,
}));

const ROWS = [
  {
    id: "budget-food",
    category_id: "cat-food",
    month: "2026-09",
    limit_amount: 750000,
  },
  {
    id: "budget-housing",
    category_id: "cat-housing",
    month: "2026-08",
    limit_amount: 1500000,
  },
];

const MAPPED: Budget[] = [
  { id: "budget-food", categoryId: "cat-food", month: "2026-09", limitAmount: 750000 },
  { id: "budget-housing", categoryId: "cat-housing", month: "2026-08", limitAmount: 1500000 },
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

describe("listBudgets", () => {
  it("returns the user's budgets mapped to the app type, newest month first", async () => {
    const order = vi.fn().mockResolvedValue({ data: ROWS, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order,
    });

    const result = await listBudgets();

    expect(mockFrom).toHaveBeenCalledWith("budgets");
    expect(order).toHaveBeenCalledWith("month", { ascending: false });
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED);
  });

  it("returns null data and the error when the query fails", async () => {
    const dbError = error("Failed to fetch budgets");
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await listBudgets();

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("createBudget", () => {
  it("inserts the budget and returns the saved row", async () => {
    const single = vi.fn().mockResolvedValue({ data: ROWS[0], error: null });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single,
    });

    const result = await createBudget({
      categoryId: "cat-food",
      month: "2026-09",
      limitAmount: 750000,
    });

    expect(mockFrom).toHaveBeenCalledWith("budgets");
    expect(mockFrom().insert).toHaveBeenCalledWith([
      { category_id: "cat-food", month: "2026-09", limit_amount: 750000 },
    ]);
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED[0]);
  });

  it("returns null data and the error when the insert fails", async () => {
    const dbError = error("Failed to insert budget");
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await createBudget({
      categoryId: "cat-housing",
      month: "2026-08",
      limitAmount: 1500000,
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("updateBudget", () => {
  it("updates only the provided fields and returns the saved budget", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { ...ROWS[0], limit_amount: 800000 },
      error: null,
    });
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({ update, eq, select, single });

    const result = await updateBudget("budget-food", { limitAmount: 800000 });

    expect(mockFrom).toHaveBeenCalledWith("budgets");
    expect(update).toHaveBeenCalledWith({ limit_amount: 800000 });
    expect(eq).toHaveBeenCalledWith("id", "budget-food");
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ ...MAPPED[0], limitAmount: 800000 });
  });

  it("maps a partial update to the snake_case row fields", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { ...ROWS[1], category_id: "cat-transport", month: "2026-09" },
      error: null,
    });
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({ update, eq, select, single });

    const result = await updateBudget("budget-housing", {
      categoryId: "cat-transport",
      month: "2026-09",
    });

    expect(update).toHaveBeenCalledWith({
      category_id: "cat-transport",
      month: "2026-09",
    });
    expect(result.data).toEqual({
      id: "budget-housing",
      categoryId: "cat-transport",
      month: "2026-09",
      limitAmount: 1500000,
    });
  });

  it("returns null data and the error when the update fails", async () => {
    const dbError = error("Failed to update budget");
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await updateBudget("budget-food", { month: "2026-10" });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("deleteBudget", () => {
  it("deletes the budget by id", async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnThis(), eq });

    const result = await deleteBudget("budget-food");

    expect(mockFrom).toHaveBeenCalledWith("budgets");
    expect(mockFrom().delete).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "budget-food");
    expect(result.error).toBeNull();
  });

  it("returns the error when the delete fails", async () => {
    const dbError = error("Failed to delete budget");
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await deleteBudget("budget-food");

    expect(result.error).toBe(dbError);
  });
});