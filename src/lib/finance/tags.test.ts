import { describe, expect, it } from "vitest";
import {
  EMPTY_TAG_FILTER,
  MAX_TAG_NAME_LENGTH,
  filterByTags,
  isDefaultTagFilter,
  isValidTagName,
  matchesTagFilter,
  normalizeTagName,
  tagNameKey,
  toggleTagFilter,
  uniqueTagIds,
} from "./tags";
import type { TagFilter } from "./tags";

const anyOf = (...tagIds: string[]): TagFilter => ({ tagIds, mode: "any" });
const allOf = (...tagIds: string[]): TagFilter => ({ tagIds, mode: "all" });

describe("normalizeTagName", () => {
  it("trims surrounding whitespace and collapses inner runs", () => {
    expect(normalizeTagName("  Travel   fund  ")).toBe("Travel fund");
  });

  it("keeps a single word unchanged", () => {
    expect(normalizeTagName("Work")).toBe("Work");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeTagName("   ")).toBe("");
  });
});

describe("isValidTagName", () => {
  it("accepts a non-empty name within the limit", () => {
    expect(isValidTagName("Subscriptions")).toBe(true);
  });

  it("accepts a name of exactly the maximum length", () => {
    expect(isValidTagName("a".repeat(MAX_TAG_NAME_LENGTH))).toBe(true);
  });

  it("rejects blank input", () => {
    expect(isValidTagName("   ")).toBe(false);
  });

  it("rejects a name longer than the maximum", () => {
    expect(isValidTagName("a".repeat(MAX_TAG_NAME_LENGTH + 1))).toBe(false);
  });
});

describe("tagNameKey", () => {
  it("normalizes case and whitespace for comparison", () => {
    expect(tagNameKey("  Travel   FUND ")).toBe("travel fund");
  });

  it("treats differently-cased spellings as the same key", () => {
    expect(tagNameKey("Work")).toBe(tagNameKey(" work "));
  });
});

describe("uniqueTagIds", () => {
  it("drops blanks and duplicates, keeping first-seen order", () => {
    expect(uniqueTagIds(["b", " ", "a", "b", "c", "a"])).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("trims ids before comparing", () => {
    expect(uniqueTagIds([" tag-1", "tag-1 "])).toEqual(["tag-1"]);
  });

  it("returns an empty list for no ids", () => {
    expect(uniqueTagIds([])).toEqual([]);
  });
});

describe("isDefaultTagFilter", () => {
  it("is true when no tag is selected", () => {
    expect(isDefaultTagFilter(EMPTY_TAG_FILTER)).toBe(true);
  });

  it("ignores blank and duplicate ids", () => {
    expect(isDefaultTagFilter(anyOf("", "  "))).toBe(true);
  });

  it("is false when at least one tag is selected", () => {
    expect(isDefaultTagFilter(anyOf("tag-1"))).toBe(false);
  });
});

describe("matchesTagFilter", () => {
  it("accepts every row when nothing is selected", () => {
    expect(matchesTagFilter([], EMPTY_TAG_FILTER)).toBe(true);
    expect(matchesTagFilter(undefined, EMPTY_TAG_FILTER)).toBe(true);
  });

  it("matches any selected tag when the mode is any", () => {
    expect(matchesTagFilter(["tag-1"], anyOf("tag-1", "tag-2"))).toBe(true);
  });

  it("rejects a row without any selected tag when the mode is any", () => {
    expect(matchesTagFilter(["tag-3"], anyOf("tag-1", "tag-2"))).toBe(false);
  });

  it("requires every selected tag when the mode is all", () => {
    expect(matchesTagFilter(["tag-1", "tag-2"], allOf("tag-1", "tag-2"))).toBe(
      true,
    );
    expect(matchesTagFilter(["tag-1"], allOf("tag-1", "tag-2"))).toBe(false);
  });

  it("treats a row with no tags as matching nothing once a tag is selected", () => {
    expect(matchesTagFilter(undefined, anyOf("tag-1"))).toBe(false);
  });

  it("ignores duplicate selections in all mode", () => {
    expect(matchesTagFilter(["tag-1"], allOf("tag-1", "tag-1"))).toBe(true);
  });
});

describe("filterByTags", () => {
  const rows = [
    { id: "t1", tagIds: ["tag-1"] },
    { id: "t2", tagIds: ["tag-2", "tag-1"] },
    { id: "t3", tagIds: [] },
    { id: "t4" },
  ];

  it("keeps every row, in order, when nothing is selected", () => {
    expect(filterByTags(rows, EMPTY_TAG_FILTER)).toEqual(rows);
  });

  it("keeps rows matching at least one tag in any mode", () => {
    expect(filterByTags(rows, anyOf("tag-2", "tag-9")).map((r) => r.id)).toEqual(
      ["t2"],
    );
  });

  it("keeps rows matching every tag in all mode", () => {
    expect(filterByTags(rows, allOf("tag-1", "tag-2")).map((r) => r.id)).toEqual(
      ["t2"],
    );
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterByTags(rows, anyOf("tag-9"))).toEqual([]);
  });

  it("does not mutate the input rows", () => {
    const input = [{ id: "t1", tagIds: ["tag-1"] }];
    filterByTags(input, anyOf("tag-9"));
    expect(input).toEqual([{ id: "t1", tagIds: ["tag-1"] }]);
  });
});

describe("toggleTagFilter", () => {
  it("adds a missing tag to the selection", () => {
    expect(toggleTagFilter(EMPTY_TAG_FILTER, "tag-1")).toEqual({
      tagIds: ["tag-1"],
      mode: "any",
    });
  });

  it("removes a selected tag and keeps the order of the rest", () => {
    expect(toggleTagFilter(anyOf("tag-1", "tag-2", "tag-3"), "tag-2")).toEqual({
      tagIds: ["tag-1", "tag-3"],
      mode: "any",
    });
  });

  it("keeps the match mode when toggling", () => {
    expect(toggleTagFilter(allOf("tag-1"), "tag-2")).toEqual({
      tagIds: ["tag-1", "tag-2"],
      mode: "all",
    });
  });

  it("ignores a blank id", () => {
    const filter = anyOf("tag-1");
    expect(toggleTagFilter(filter, "   ")).toBe(filter);
  });

  it("does not mutate the original filter", () => {
    const filter = anyOf("tag-1");
    toggleTagFilter(filter, "tag-2");
    expect(filter).toEqual({ tagIds: ["tag-1"], mode: "any" });
  });
});
