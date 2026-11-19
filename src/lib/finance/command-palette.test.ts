import { describe, expect, it } from "vitest";
import {
  filterPaletteCommands,
  isPaletteShortcut,
  movePaletteSelection,
  type PaletteCommand,
} from "./command-palette";

const COMMANDS: readonly PaletteCommand[] = [
  {
    id: "add",
    label: "Add transaction",
    description: "Quick add an income or expense",
    keywords: ["new", "expense"],
  },
  {
    id: "transactions",
    label: "Go to Transactions",
    description: "Browse your history",
    keywords: ["list"],
  },
  {
    id: "settings",
    label: "Go to Settings",
    description: "Currency and preferences",
  },
];

describe("isPaletteShortcut", () => {
  it("accepts Control+K and Command+K", () => {
    expect(
      isPaletteShortcut({ key: "k", ctrlKey: true, metaKey: false, altKey: false }),
    ).toBe(true);
    expect(
      isPaletteShortcut({ key: "K", ctrlKey: false, metaKey: true, altKey: false }),
    ).toBe(true);
  });

  it("ignores plain keys, other modifiers and Alt combinations", () => {
    expect(
      isPaletteShortcut({ key: "k", ctrlKey: false, metaKey: false, altKey: false }),
    ).toBe(false);
    expect(
      isPaletteShortcut({ key: "x", ctrlKey: true, metaKey: false, altKey: false }),
    ).toBe(false);
    expect(
      isPaletteShortcut({ key: "k", ctrlKey: true, metaKey: false, altKey: true }),
    ).toBe(false);
  });
});

describe("filterPaletteCommands", () => {
  it("returns every command for a blank query", () => {
    expect(filterPaletteCommands(COMMANDS, "   ")).toEqual([...COMMANDS]);
  });

  it("matches labels, descriptions and keywords without case sensitivity", () => {
    expect(filterPaletteCommands(COMMANDS, "SETTINGS").map((c) => c.id)).toEqual([
      "settings",
    ]);
    expect(filterPaletteCommands(COMMANDS, "history").map((c) => c.id)).toEqual([
      "transactions",
    ]);
    expect(filterPaletteCommands(COMMANDS, "NEW").map((c) => c.id)).toEqual([
      "add",
    ]);
  });

  it("ranks exact and prefix label matches ahead of other matches", () => {
    expect(filterPaletteCommands(COMMANDS, "go to").map((c) => c.id)).toEqual([
      "transactions",
      "settings",
    ]);
    expect(filterPaletteCommands(COMMANDS, "add transaction").map((c) => c.id)).toEqual([
      "add",
    ]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterPaletteCommands(COMMANDS, "pizza")).toEqual([]);
  });
});

describe("movePaletteSelection", () => {
  it("moves down and wraps at the end", () => {
    expect(movePaletteSelection(0, 1, 3)).toBe(1);
    expect(movePaletteSelection(2, 1, 3)).toBe(0);
  });

  it("moves up and wraps at the start", () => {
    expect(movePaletteSelection(0, -1, 3)).toBe(2);
    expect(movePaletteSelection(1, -1, 3)).toBe(0);
  });

  it("handles an empty list and an unset selection", () => {
    expect(movePaletteSelection(0, 1, 0)).toBe(-1);
    expect(movePaletteSelection(-1, 1, 3)).toBe(0);
  });
});
