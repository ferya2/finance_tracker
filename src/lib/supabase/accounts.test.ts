import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  createAccount,
  deleteAccount,
  listAccounts,
  updateAccount,
} from "./accounts";
import type { Account } from "@/types/account";

const { mockCreateClient, mockFrom } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: mockCreateClient,
}));

const ROWS = [
  {
    id: "acc-cash",
    name: "Cash",
    kind: "cash",
    opening_balance: 50000,
    color: "#0ea5e9",
  },
  {
    id: "acc-checking",
    name: "Everyday checking",
    kind: "checking",
    opening_balance: 200000,
    color: "#059669",
  },
];

const MAPPED: Account[] = [
  {
    id: "acc-cash",
    name: "Cash",
    kind: "cash",
    openingBalance: 50000,
    color: "#0ea5e9",
  },
  {
    id: "acc-checking",
    name: "Everyday checking",
    kind: "checking",
    openingBalance: 200000,
    color: "#059669",
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

describe("listAccounts", () => {
  it("returns the user's accounts mapped to the app type, alphabetical", async () => {
    const order = vi.fn().mockResolvedValue({ data: ROWS, error: null });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order,
    });

    const result = await listAccounts();

    expect(mockFrom).toHaveBeenCalledWith("accounts");
    expect(order).toHaveBeenCalledWith("name", { ascending: true });
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED);
  });

  it("returns null data and the error when the query fails", async () => {
    const dbError = error("Failed to fetch accounts");
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await listAccounts();

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("createAccount", () => {
  it("inserts the account and returns the saved row", async () => {
    const single = vi.fn().mockResolvedValue({ data: ROWS[0], error: null });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single,
    });

    const result = await createAccount({
      name: "Cash",
      kind: "cash",
      openingBalance: 50000,
      color: "#0ea5e9",
    });

    expect(mockFrom).toHaveBeenCalledWith("accounts");
    expect(mockFrom().insert).toHaveBeenCalledWith([
      {
        name: "Cash",
        kind: "cash",
        opening_balance: 50000,
        color: "#0ea5e9",
      },
    ]);
    expect(result.error).toBeNull();
    expect(result.data).toEqual(MAPPED[0]);
  });

  it("returns null data and the error when the insert fails", async () => {
    const dbError = error("Failed to insert account");
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await createAccount({
      name: "Savings",
      kind: "savings",
      openingBalance: 1000000,
      color: "#7c3aed",
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("updateAccount", () => {
  it("updates only the provided fields and returns the saved account", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { ...ROWS[1], opening_balance: 250000 },
      error: null,
    });
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({ update, eq, select, single });

    const result = await updateAccount("acc-checking", {
      openingBalance: 250000,
    });

    expect(mockFrom).toHaveBeenCalledWith("accounts");
    expect(update).toHaveBeenCalledWith({ opening_balance: 250000 });
    expect(eq).toHaveBeenCalledWith("id", "acc-checking");
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ ...MAPPED[1], openingBalance: 250000 });
  });

  it("maps a partial update to the snake_case row fields", async () => {
    const single = vi.fn().mockResolvedValue({
      data: { ...ROWS[0], name: "Wallet", kind: "checking" },
      error: null,
    });
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    mockFrom.mockReturnValue({ update, eq, select, single });

    const result = await updateAccount("acc-cash", {
      name: "Wallet",
      kind: "checking",
    });

    expect(update).toHaveBeenCalledWith({ name: "Wallet", kind: "checking" });
    expect(result.data).toEqual({
      id: "acc-cash",
      name: "Wallet",
      kind: "checking",
      openingBalance: 50000,
      color: "#0ea5e9",
    });
  });

  it("returns null data and the error when the update fails", async () => {
    const dbError = error("Failed to update account");
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await updateAccount("acc-cash", { color: "#f59e0b" });

    expect(result.data).toBeNull();
    expect(result.error).toBe(dbError);
  });
});

describe("deleteAccount", () => {
  it("deletes the account by id", async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({ delete: vi.fn().mockReturnThis(), eq });

    const result = await deleteAccount("acc-cash");

    expect(mockFrom).toHaveBeenCalledWith("accounts");
    expect(mockFrom().delete).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "acc-cash");
    expect(result.error).toBeNull();
  });

  it("returns the error when the delete fails", async () => {
    const dbError = error("Failed to delete account");
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    });

    const result = await deleteAccount("acc-cash");

    expect(result.error).toBe(dbError);
  });
});
