import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { useUserData } from "./use-user-data";
import type { UserData } from "@/lib/supabase/dashboard";

const { mockLoadUserData } = vi.hoisted(() => ({
  mockLoadUserData: vi.fn(),
}));

vi.mock("@/lib/supabase/dashboard", () => ({
  loadUserData: mockLoadUserData,
}));

const DATA: UserData = {
  transactions: [
    {
      id: "txn-1",
      amount: 115000,
      type: "expense",
      categoryId: "cat-housing",
      note: "Rent",
      occurredOn: "2026-09-04",
    },
  ],
  categories: [
    { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
  ],
  budgets: [
    {
      id: "budget-housing",
      categoryId: "cat-housing",
      month: "2026-09",
      limitAmount: 130000,
    },
  ],
};

function error(message: string): PostgrestError {
  return { message } as unknown as PostgrestError;
}

beforeEach(() => {
  mockLoadUserData.mockReset();
});

describe("useUserData", () => {
  it("starts loading and settles to ready with the fetched data", async () => {
    mockLoadUserData.mockResolvedValue({ data: DATA, error: null });

    const { result } = renderHook(() => useUserData());

    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toEqual(DATA);
    expect(result.current.error).toBeNull();
    expect(mockLoadUserData).toHaveBeenCalledOnce();
  });

  it("settles to error and exposes the error when the fetch fails", async () => {
    const dbError = error("Failed to load data");
    mockLoadUserData.mockResolvedValue({ data: null, error: dbError });

    const { result } = renderHook(() => useUserData());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(dbError);
  });

  it("refetches when reload is called", async () => {
    mockLoadUserData.mockResolvedValue({ data: DATA, error: null });

    const { result } = renderHook(() => useUserData());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      result.current.reload();
    });

    expect(mockLoadUserData).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });
});