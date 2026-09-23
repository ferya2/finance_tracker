import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  createCategory,
  deleteCategory,
  listCategories,
  seedDefaultCategories,
  updateCategory,
} from "./categories";
import type { Category } from "@/types/category";

const { mockCreateClient, mockFrom } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mockCreateClient,
}));

const ROWS = [
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
];

const MAPPED: Category[] = [
  { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  { id: "cat-salary", name: "Salary", color: "#059669", kind: "income" },
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

describe("listCategories", () => {
  it("returns the user's categories mapped to the app type, alphabetical", async () => {
    const order = vi.fn().mockResolvedValue({ data: ROWS, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order,
    });

    const result = await listCategories();

    expect(mockFrom).toHaveBeenCalledWith("categories");
    expect(order).toHaveBeenCalledWith("name", { ascending: true });
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED);
  });

  it("returns null data and the error when the query fails", async () => {
    const dbError = error("Failed to fetch categories");
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await listCategories();

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("createCategory", () => {
  it("inserts the category and returns the saved row", async () => {
    const single = vi.fn().mockResolvedValue({ data: ROWS[0], error: null });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single,
    });

    const result = await createCategory({
      name: "Food & dining",
      color: "#e11d48",
      kind: "expense",
    });

    expect(mockFrom).toHaveBeenCalledWith("categories");
    expect(mockFrom().insert).toHaveBeenCalledWith([
      { name: "Food & dining", color: "#e11d48", kind: "expense" },
    ]);
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED[0]);
  });

  it("returns null data and the error when the insert fails", async () => {
    const dbError = error("Failed to insert category");
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await createCategory({
      name: "Transport",
      color: "#0284c7",
      kind: "expense",
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("updateCategory", () => {
  it("updates only the provided fields and returns the saved category", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { ...ROWS[0], color: "#f43f5e" },
      error: null,
    });
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({ update, eq, select, single });

    const result = await updateCategory("cat-food", { color: "#f43f5e" });

    expect(mockFrom).toHaveBeenCalledWith("categories");
    expect(update).toHaveBeenCalledWith({ color: "#f43f5e" });
    expect(eq).toHaveBeenCalledWith("id", "cat-food");
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ ...MAPPED[0], color: "#f43f5e" });
  });

  it("returns null data and the error when the update fails", async () => {
    const dbError = error("Failed to update category");
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await updateCategory("cat-food", { name: "Groceries" });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("deleteCategory", () => {
  it("deletes the category by id", async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnThis(), eq });

    const result = await deleteCategory("cat-food");

    expect(mockFrom).toHaveBeenCalledWith("categories");
    expect(mockFrom().delete).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "cat-food");
    expect(result.error).toBeNull();
  });

  it("returns the error when the delete fails", async () => {
    const dbError = error("Failed to delete category");
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await deleteCategory("cat-food");

    expect(result.error).toBe(dbError);
  });
});

describe("seedDefaultCategories", () => {
  it("inserts the defaults when the user has no categories yet", async () => {
    mockFrom
      .mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }))
      .mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: ROWS, error: null }),
      }));

    const result = await seedDefaultCategories();

    expect(mockFrom).toHaveBeenCalledTimes(2);
    expect(mockFrom).toHaveBeenNthCalledWith(1, "categories");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "categories");
    expect(result.data).toEqual(MAPPED);
    expect(result.error).toBeNull();
    expect(result.seeded).toBe(2);
  });

  it("does not seed and reports 0 when the user already has categories", async () => {
    const order = vi.fn().mockResolvedValue({ data: ROWS, error: null });
    const query = { select: vi.fn().mockReturnThis(), order };
    mockFrom.mockReturnValue(query);

    const result = await seedDefaultCategories();

    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveProperty("insert");
    expect(result.data).toEqual(MAPPED);
    expect(result.error).toBeNull();
    expect(result.seeded).toBe(0);
  });

  it("returns the read error and does not insert when listing fails", async () => {
    const dbError = error("Failed to fetch categories");
    const order = vi.fn().mockResolvedValue({ data: null, error: dbError });
    const query = { select: vi.fn().mockReturnThis(), order };
    mockFrom.mockReturnValue(query);

    const result = await seedDefaultCategories();

    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveProperty("insert");
    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
    expect(result.seeded).toBe(0);
  });
});