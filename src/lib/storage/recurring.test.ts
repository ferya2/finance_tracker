import { describe, expect, it, vi } from "vitest";
import type { RecurringTransaction } from "@/types/recurring";
import {
  loadRecurringEntries,
  parseRecurringEntries,
  RECURRING_STORAGE_PREFIX,
  recurringStorageKey,
  saveRecurringEntries,
  type RecurringStorage,
} from "./recurring";

const ENTRY: RecurringTransaction = {
  id: "rec-1",
  amount: 2500,
  type: "expense",
  categoryId: "cat-food",
  note: "Weekly shop",
  startOn: "2026-09-01",
  frequency: "weekly",
  interval: 1,
};

function fakeStorage(initial: Record<string, string> = {}): RecurringStorage & {
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

describe("recurringStorageKey", () => {
  it("scopes the key to a user", () => {
    expect(recurringStorageKey("user-1")).toBe(
      `${RECURRING_STORAGE_PREFIX}:user-1`,
    );
  });

  it("trims the user id and falls back to anonymous", () => {
    expect(recurringStorageKey("  user-1  ")).toBe(
      `${RECURRING_STORAGE_PREFIX}:user-1`,
    );
    expect(recurringStorageKey(null)).toBe(`${RECURRING_STORAGE_PREFIX}:anonymous`);
    expect(recurringStorageKey("   ")).toBe(`${RECURRING_STORAGE_PREFIX}:anonymous`);
  });
});

describe("parseRecurringEntries", () => {
  it("returns nothing for empty or malformed payloads", () => {
    expect(parseRecurringEntries(null)).toEqual([]);
    expect(parseRecurringEntries("")).toEqual([]);
    expect(parseRecurringEntries("not json")).toEqual([]);
    expect(parseRecurringEntries(JSON.stringify({ nope: true }))).toEqual([]);
  });

  it("keeps valid entries from a payload", () => {
    expect(parseRecurringEntries(JSON.stringify([ENTRY]))).toEqual([ENTRY]);
  });
});

describe("loadRecurringEntries", () => {
  it("returns nothing when storage is unavailable or empty", () => {
    expect(loadRecurringEntries("user-1", null)).toEqual([]);
    expect(loadRecurringEntries("user-1", fakeStorage())).toEqual([]);
  });

  it("reads the entries saved for that user", () => {
    const storage = fakeStorage({
      [recurringStorageKey("user-1")]: JSON.stringify([ENTRY]),
      [recurringStorageKey("user-2")]: JSON.stringify([]),
    });

    expect(loadRecurringEntries("user-1", storage)).toEqual([ENTRY]);
  });

  it("treats corrupt or invalid payloads as empty", () => {
    expect(
      loadRecurringEntries(
        "user-1",
        fakeStorage({ [recurringStorageKey("user-1")]: "not json" }),
      ),
    ).toEqual([]);

    expect(
      loadRecurringEntries(
        "user-1",
        fakeStorage({
          [recurringStorageKey("user-1")]: JSON.stringify([
            ENTRY,
            { ...ENTRY, id: "", amount: 0 },
          ]),
        }),
      ),
    ).toEqual([ENTRY]);
  });
});

describe("saveRecurringEntries", () => {
  it("writes the entries under the user's key", () => {
    const storage = fakeStorage();

    saveRecurringEntries("user-1", [ENTRY], storage);

    expect(storage.values.get(recurringStorageKey("user-1"))).toBe(
      JSON.stringify([ENTRY]),
    );
  });

  it("does nothing when storage is unavailable", () => {
    expect(() => saveRecurringEntries("user-1", [ENTRY], null)).not.toThrow();
  });

  it("swallows a storage failure", () => {
    const storage: RecurringStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };

    expect(() => saveRecurringEntries("user-1", [ENTRY], storage)).not.toThrow();
  });
});
