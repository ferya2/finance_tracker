import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { createTag, deleteTag, listTags, updateTag } from "./tags";
import type { Tag } from "@/types/tag";

const { mockCreateClient, mockFrom } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mockCreateClient,
}));

const ROWS = [
  {
    id: "tag-travel",
    name: "Travel",
    color: "#0ea5e9",
  },
  {
    id: "tag-work",
    name: "Work",
    color: "#7c3aed",
  },
];

const MAPPED: Tag[] = [
  {
    id: "tag-travel",
    name: "Travel",
    color: "#0ea5e9",
  },
  {
    id: "tag-work",
    name: "Work",
    color: "#7c3aed",
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

describe("listTags", () => {
  it("returns the user's tags mapped to the app type, alphabetical", async () => {
    const order = vi.fn().mockResolvedValue({ data: ROWS, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order,
    });

    const result = await listTags();

    expect(mockFrom).toHaveBeenCalledWith("tags");
    expect(order).toHaveBeenCalledWith("name", { ascending: true });
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED);
  });

  it("returns null data and the error when the query fails", async () => {
    const dbError = error("Failed to fetch tags");
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await listTags();

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("createTag", () => {
  it("inserts the tag and returns the saved row", async () => {
    const single = vi.fn().mockResolvedValue({ data: ROWS[0], error: null });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single,
    });

    const result = await createTag({ name: "Travel", color: "#0ea5e9" });

    expect(mockFrom).toHaveBeenCalledWith("tags");
    expect(mockFrom().insert).toHaveBeenCalledWith([
      { name: "Travel", color: "#0ea5e9" },
    ]);
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED[0]);
  });

  it("returns null data and the error when the insert fails", async () => {
    const dbError = error("Failed to insert tag");
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await createTag({ name: "Travel", color: "#0ea5e9" });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("updateTag", () => {
  it("updates only the provided fields and returns the saved tag", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { ...ROWS[1], color: "#f59e0b" },
      error: null,
    });
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({ update, eq, select, single });

    const result = await updateTag("tag-work", { color: "#f59e0b" });

    expect(mockFrom).toHaveBeenCalledWith("tags");
    expect(update).toHaveBeenCalledWith({ color: "#f59e0b" });
    expect(eq).toHaveBeenCalledWith("id", "tag-work");
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ ...MAPPED[1], color: "#f59e0b" });
  });

  it("maps a name update to the snake_case row fields", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { ...ROWS[0], name: "Trips" },
      error: null,
    });
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({ update, eq, select, single });

    const result = await updateTag("tag-travel", { name: "Trips" });

    expect(update).toHaveBeenCalledWith({ name: "Trips" });
    expect(result.data).toEqual({
      id: "tag-travel",
      name: "Trips",
      color: "#0ea5e9",
    });
  });

  it("returns null data and the error when the update fails", async () => {
    const dbError = error("Failed to update tag");
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await updateTag("tag-travel", { color: "#f59e0b" });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("deleteTag", () => {
  it("deletes the tag by id", async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnThis(), eq });

    const result = await deleteTag("tag-travel");

    expect(mockFrom).toHaveBeenCalledWith("tags");
    expect(mockFrom().delete).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "tag-travel");
    expect(result.error).toBeNull();
  });

  it("returns the error when the delete fails", async () => {
    const dbError = error("Failed to delete tag");
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await deleteTag("tag-travel");

    expect(result.error).toBe(dbError);
  });
});
