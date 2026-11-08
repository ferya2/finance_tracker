import { describe, expect, it, vi } from "vitest";
import type { SavingsGoal } from "@/types/goal";
import {
  loadSavingsGoals,
  parseSavingsGoals,
  SAVINGS_GOALS_STORAGE_PREFIX,
  savingsGoalsStorageKey,
  saveSavingsGoals,
  type SavingsGoalStorage,
} from "./goals";

const GOAL: SavingsGoal = {
  id: "goal-1",
  name: "Holiday",
  savedAmount: 120000,
  targetAmount: 500000,
  targetDate: "2027-06-01",
  color: "#2563eb",
};

function fakeStorage(
  initial: Record<string, string> = {},
): SavingsGoalStorage & { values: Map<string, string> } {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("savingsGoalsStorageKey", () => {
  it("scopes the key to a user", () => {
    expect(savingsGoalsStorageKey("user-1")).toBe(
      `${SAVINGS_GOALS_STORAGE_PREFIX}:user-1`,
    );
  });

  it("trims the user id and falls back to anonymous", () => {
    expect(savingsGoalsStorageKey("  user-1  ")).toBe(
      `${SAVINGS_GOALS_STORAGE_PREFIX}:user-1`,
    );
    expect(savingsGoalsStorageKey(null)).toBe(
      `${SAVINGS_GOALS_STORAGE_PREFIX}:anonymous`,
    );
    expect(savingsGoalsStorageKey("   ")).toBe(
      `${SAVINGS_GOALS_STORAGE_PREFIX}:anonymous`,
    );
  });
});

describe("parseSavingsGoals", () => {
  it("returns nothing for empty or malformed payloads", () => {
    expect(parseSavingsGoals(null)).toEqual([]);
    expect(parseSavingsGoals("")).toEqual([]);
    expect(parseSavingsGoals("not json")).toEqual([]);
    expect(parseSavingsGoals(JSON.stringify({ nope: true }))).toEqual([]);
  });

  it("keeps valid goals from a payload", () => {
    expect(parseSavingsGoals(JSON.stringify([GOAL]))).toEqual([GOAL]);
  });
});

describe("loadSavingsGoals", () => {
  it("returns nothing when storage is unavailable or empty", () => {
    expect(loadSavingsGoals("user-1", null)).toEqual([]);
    expect(loadSavingsGoals("user-1", fakeStorage())).toEqual([]);
  });

  it("reads the goals saved for that user", () => {
    const storage = fakeStorage({
      [savingsGoalsStorageKey("user-1")]: JSON.stringify([GOAL]),
      [savingsGoalsStorageKey("user-2")]: JSON.stringify([]),
    });

    expect(loadSavingsGoals("user-1", storage)).toEqual([GOAL]);
  });

  it("treats corrupt or invalid payloads as empty", () => {
    expect(
      loadSavingsGoals(
        "user-1",
        fakeStorage({ [savingsGoalsStorageKey("user-1")]: "not json" }),
      ),
    ).toEqual([]);

    expect(
      loadSavingsGoals(
        "user-1",
        fakeStorage({
          [savingsGoalsStorageKey("user-1")]: JSON.stringify([
            GOAL,
            { ...GOAL, id: "", targetAmount: 0 },
          ]),
        }),
      ),
    ).toEqual([GOAL]);
  });
});

describe("saveSavingsGoals", () => {
  it("writes the goals under the user's key", () => {
    const storage = fakeStorage();

    saveSavingsGoals("user-1", [GOAL], storage);

    expect(storage.values.get(savingsGoalsStorageKey("user-1"))).toBe(
      JSON.stringify([GOAL]),
    );
  });

  it("drops invalid goals before writing", () => {
    const storage = fakeStorage();

    saveSavingsGoals(
      "user-1",
      [GOAL, { ...GOAL, id: "bad", targetAmount: 0 }],
      storage,
    );

    expect(storage.values.get(savingsGoalsStorageKey("user-1"))).toBe(
      JSON.stringify([GOAL]),
    );
  });

  it("does nothing when storage is unavailable", () => {
    expect(() => saveSavingsGoals("user-1", [GOAL], null)).not.toThrow();
  });

  it("swallows a storage failure", () => {
    const storage: SavingsGoalStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };

    expect(() => saveSavingsGoals("user-1", [GOAL], storage)).not.toThrow();
  });
});
