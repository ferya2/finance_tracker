import { describe, expect, it } from "vitest";
import {
  MAX_TAG_NAME,
  TAG_COLOR_PALETTE,
  emptyTagForm,
  tagToFormValues,
  toNewTag,
  validateTagForm,
} from "./tag-form";
import type { Tag } from "@/types/tag";

const TAG: Tag = { id: "tag-1", name: "Travel", color: "#0ea5e9" };

describe("emptyTagForm", () => {
  it("starts empty with the default palette colour", () => {
    expect(emptyTagForm()).toEqual({
      name: "",
      color: TAG_COLOR_PALETTE[2],
    });
  });

  it("accepts a different starting colour", () => {
    expect(emptyTagForm("#059669").color).toBe("#059669");
  });
});

describe("tagToFormValues", () => {
  it("copies the saved tag's name and colour", () => {
    expect(tagToFormValues(TAG)).toEqual({
      name: "Travel",
      color: "#0ea5e9",
    });
  });
});

describe("toNewTag", () => {
  it("normalizes the name and keeps the colour", () => {
    expect(
      toNewTag({ name: "  Travel   fund ", color: "#0ea5e9" }),
    ).toEqual({
      name: "Travel fund",
      color: "#0ea5e9",
    });
  });
});

describe("validateTagForm", () => {
  it("accepts a valid form", () => {
    expect(validateTagForm({ name: "Travel", color: "#0ea5e9" })).toEqual({});
  });

  it("requires a name", () => {
    expect(validateTagForm({ name: "   ", color: "#0ea5e9" }).name).toBe(
      "Name is required.",
    );
  });

  it("rejects a name longer than the limit", () => {
    expect(
      validateTagForm({
        name: "a".repeat(MAX_TAG_NAME + 1),
        color: "#0ea5e9",
      }).name,
    ).toBe(`Name must be at most ${MAX_TAG_NAME} characters.`);
  });

  it("rejects an invalid colour", () => {
    expect(
      validateTagForm({ name: "Travel", color: "blue" }).color,
    ).toBe("Choose a valid colour.");
  });
});
