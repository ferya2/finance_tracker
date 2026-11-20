import { describe, expect, it } from "vitest";
import {
  formatShortcutKeys,
  isEditableTarget,
  isShortcutPrefix,
  KEYBOARD_SHORTCUTS,
  matchShortcut,
  normalizeShortcutKey,
  SHORTCUT_GROUP_ORDER,
  type ShortcutKeyEvent,
} from "./keyboard-shortcuts";

describe("normalizeShortcutKey", () => {
  it("normalizes plain keys to lowercase", () => {
    expect(normalizeShortcutKey({ key: "G" })).toBe("g");
    expect(normalizeShortcutKey({ key: "?" })).toBe("?");
    expect(normalizeShortcutKey({ key: " " })).toBe("space");
  });

  it("treats Ctrl and Meta as one modifier", () => {
    expect(normalizeShortcutKey({ key: "k", ctrlKey: true })).toBe("mod+k");
    expect(
      normalizeShortcutKey({
        key: "K",
        metaKey: true,
        shiftKey: true,
      } as unknown as ShortcutKeyEvent),
    ).toBe("mod+k");
  });

  it("keeps Alt separate", () => {
    expect(normalizeShortcutKey({ key: "k", ctrlKey: true, altKey: true })).toBe(
      "mod+alt+k",
    );
    expect(normalizeShortcutKey({ key: "ArrowDown", altKey: true })).toBe(
      "alt+arrowdown",
    );
  });
});

describe("isEditableTarget", () => {
  it("ignores missing targets", () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget({})).toBe(false);
    expect(isEditableTarget({ tagName: "DIV" })).toBe(false);
  });

  it("detects form fields and contenteditable elements", () => {
    expect(isEditableTarget({ tagName: "input" })).toBe(true);
    expect(isEditableTarget({ tagName: "TEXTAREA" })).toBe(true);
    expect(isEditableTarget({ tagName: "select" })).toBe(true);
    expect(isEditableTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });
});

describe("matchShortcut", () => {
  it("matches single-key and modified shortcuts", () => {
    expect(matchShortcut(["?"])?.id).toBe("help");
    expect(matchShortcut(["mod+k"])?.id).toBe("command-palette");
    expect(matchShortcut(["n"])?.id).toBe("quick-add");
  });

  it("matches navigation sequences in order", () => {
    const match = matchShortcut(["g", "t"]);
    expect(match?.id).toBe("go-transactions");
    expect(match?.href).toBe("/dashboard/transactions");
    expect(matchShortcut(["t", "g"])).toBeUndefined();
  });

  it("rejects partial, extra and unknown sequences", () => {
    expect(matchShortcut(["g"])).toBeUndefined();
    expect(matchShortcut(["g", "t", "x"])).toBeUndefined();
    expect(matchShortcut(["mod+shift+k"])).toBeUndefined();
    expect(matchShortcut(["?"], [])).toBeUndefined();
  });
});

describe("isShortcutPrefix", () => {
  it("recognizes the first key of a sequence", () => {
    expect(isShortcutPrefix(["g"])).toBe(true);
  });

  it("rejects complete sequences and unknown keys", () => {
    expect(isShortcutPrefix(["g", "t"])).toBe(false);
    expect(isShortcutPrefix(["?"])).toBe(false);
    expect(isShortcutPrefix([])).toBe(false);
    expect(isShortcutPrefix(["z"])).toBe(false);
  });
});

describe("formatShortcutKeys", () => {
  it("formats modifiers and sequences for display", () => {
    expect(formatShortcutKeys(["mod+k"])).toEqual(["Ctrl+K"]);
    expect(formatShortcutKeys(["g", "t"])).toEqual(["G", "T"]);
    expect(formatShortcutKeys(["?"])).toEqual(["?"]);
    expect(formatShortcutKeys(["alt+arrowdown"])).toEqual(["Alt+ARROWDOWN"]);
  });
});

describe("KEYBOARD_SHORTCUTS", () => {
  it("keeps every shortcut unique and grouped", () => {
    const sequences = KEYBOARD_SHORTCUTS.map((shortcut) => shortcut.sequence.join(" "));
    expect(new Set(sequences).size).toBe(sequences.length);
    expect(new Set(KEYBOARD_SHORTCUTS.map((shortcut) => shortcut.id)).size).toBe(
      KEYBOARD_SHORTCUTS.length,
    );
    for (const group of SHORTCUT_GROUP_ORDER) {
      expect(KEYBOARD_SHORTCUTS.some((shortcut) => shortcut.group === group)).toBe(true);
    }
  });

  it("gives every navigation shortcut a destination", () => {
    for (const shortcut of KEYBOARD_SHORTCUTS.filter((item) => item.group === "Navigation")) {
      expect(shortcut.href).toMatch(/^\/dashboard/);
    }
  });
});
