import { describe, expect, it, vi } from "vitest";
import type { Transfer } from "@/types/transfer";
import {
  loadTransfers,
  parseTransfers,
  saveTransfers,
  TRANSFERS_STORAGE_PREFIX,
  transferStorageKey,
  type TransferStorage,
} from "./transfers";

const TRANSFER: Transfer = {
  id: "tr-1",
  fromAccountId: "acc-checking",
  toAccountId: "acc-savings",
  amount: 50000,
  note: "Monthly saving",
  occurredOn: "2026-09-01",
};

function fakeStorage(initial: Record<string, string> = {}): TransferStorage & {
  values: Map<string, string>;
} {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("transferStorageKey", () => {
  it("scopes the key to a user", () => {
    expect(transferStorageKey("user-1")).toBe(
      `${TRANSFERS_STORAGE_PREFIX}:user-1`,
    );
  });

  it("trims the user id and falls back to anonymous", () => {
    expect(transferStorageKey("  user-1  ")).toBe(
      `${TRANSFERS_STORAGE_PREFIX}:user-1`,
    );
    expect(transferStorageKey(null)).toBe(
      `${TRANSFERS_STORAGE_PREFIX}:anonymous`,
    );
    expect(transferStorageKey("   ")).toBe(
      `${TRANSFERS_STORAGE_PREFIX}:anonymous`,
    );
  });
});

describe("parseTransfers", () => {
  it("returns nothing for empty or malformed payloads", () => {
    expect(parseTransfers(null)).toEqual([]);
    expect(parseTransfers("")).toEqual([]);
    expect(parseTransfers("not json")).toEqual([]);
    expect(parseTransfers(JSON.stringify({ nope: true }))).toEqual([]);
  });

  it("keeps valid transfers from a payload", () => {
    expect(parseTransfers(JSON.stringify([TRANSFER]))).toEqual([TRANSFER]);
  });
});

describe("loadTransfers", () => {
  it("returns nothing when storage is unavailable or empty", () => {
    expect(loadTransfers("user-1", null)).toEqual([]);
    expect(loadTransfers("user-1", fakeStorage())).toEqual([]);
  });

  it("reads the transfers saved for that user", () => {
    const storage = fakeStorage({
      [transferStorageKey("user-1")]: JSON.stringify([TRANSFER]),
      [transferStorageKey("user-2")]: JSON.stringify([]),
    });

    expect(loadTransfers("user-1", storage)).toEqual([TRANSFER]);
  });

  it("treats corrupt or invalid payloads as empty", () => {
    expect(
      loadTransfers(
        "user-1",
        fakeStorage({ [transferStorageKey("user-1")]: "not json" }),
      ),
    ).toEqual([]);

    expect(
      loadTransfers(
        "user-1",
        fakeStorage({
          [transferStorageKey("user-1")]: JSON.stringify([
            TRANSFER,
            { ...TRANSFER, id: "", amount: 0 },
          ]),
        }),
      ),
    ).toEqual([TRANSFER]);
  });
});

describe("saveTransfers", () => {
  it("writes the transfers under the user's key", () => {
    const storage = fakeStorage();

    saveTransfers("user-1", [TRANSFER], storage);

    expect(storage.values.get(transferStorageKey("user-1"))).toBe(
      JSON.stringify([TRANSFER]),
    );
  });

  it("does nothing when storage is unavailable", () => {
    expect(() => saveTransfers("user-1", [TRANSFER], null)).not.toThrow();
  });

  it("swallows a storage failure", () => {
    const storage: TransferStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };

    expect(() => saveTransfers("user-1", [TRANSFER], storage)).not.toThrow();
  });
});
