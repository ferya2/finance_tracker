import { describe, expect, it, vi } from "vitest";
import {
  TAG_ASSIGNMENTS_CHANGE_EVENT,
  TAG_ASSIGNMENTS_STORAGE_PREFIX,
  loadTagAssignments,
  parseTagAssignments,
  saveTagAssignments,
  tagAssignmentStorageKey,
  type TagAssignmentStorage,
} from "./tags";

function memoryStorage(initial: Record<string, string> = {}): TagAssignmentStorage {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

describe("tagAssignmentStorageKey", () => {
  it("scopes the key by user id", () => {
    expect(tagAssignmentStorageKey("user-1")).toBe(
      `${TAG_ASSIGNMENTS_STORAGE_PREFIX}:user-1`,
    );
  });

  it("falls back to an anonymous key", () => {
    expect(tagAssignmentStorageKey(null)).toBe(
      `${TAG_ASSIGNMENTS_STORAGE_PREFIX}:anonymous`,
    );
    expect(tagAssignmentStorageKey("  ")).toBe(
      `${TAG_ASSIGNMENTS_STORAGE_PREFIX}:anonymous`,
    );
  });
});

describe("parseTagAssignments", () => {
  it("parses and sanitizes stored assignments", () => {
    expect(
      parseTagAssignments(
        JSON.stringify([
          { transactionId: "txn-1", tagIds: ["tag-1", "tag-1"] },
        ]),
      ),
    ).toEqual([{ transactionId: "txn-1", tagIds: ["tag-1"] }]);
  });

  it("returns no assignments for missing or invalid JSON", () => {
    expect(parseTagAssignments(null)).toEqual([]);
    expect(parseTagAssignments("{")).toEqual([]);
  });
});

describe("loadTagAssignments", () => {
  it("reads the signed-in user's assignments", () => {
    const storage = memoryStorage({
      [tagAssignmentStorageKey("user-1")]: JSON.stringify([
        { transactionId: "txn-1", tagIds: ["tag-1"] },
      ]),
    });

    expect(loadTagAssignments("user-1", storage)).toEqual([
      { transactionId: "txn-1", tagIds: ["tag-1"] },
    ]);
  });

  it("returns no assignments without storage", () => {
    expect(loadTagAssignments("user-1", null)).toEqual([]);
  });
});

describe("saveTagAssignments", () => {
  it("sanitizes and writes the assignments under the user's key", () => {
    const storage = memoryStorage();
    const setItem = vi.spyOn(storage, "setItem");

    saveTagAssignments(
      "user-1",
      [{ transactionId: " txn-1 ", tagIds: ["tag-1", "tag-1"] }],
      storage,
    );

    expect(setItem).toHaveBeenCalledWith(
      tagAssignmentStorageKey("user-1"),
      JSON.stringify([{ transactionId: "txn-1", tagIds: ["tag-1"] }]),
    );
    expect(loadTagAssignments("user-1", storage)).toEqual([
      { transactionId: "txn-1", tagIds: ["tag-1"] },
    ]);
  });

  it("announces the change on the window", () => {
    const storage = memoryStorage();
    const dispatch = vi.fn();
    vi.stubGlobal("window", { dispatchEvent: dispatch });

    saveTagAssignments("user-1", [], storage);

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: TAG_ASSIGNMENTS_CHANGE_EVENT }),
    );

    vi.unstubAllGlobals();
  });
});
