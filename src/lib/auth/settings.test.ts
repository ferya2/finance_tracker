import { describe, expect, it } from "vitest";
import type { CurrencyCode } from "@/lib/finance/currency";
import {
  normalizeDisplayName,
  parseThemePreference,
  settingsFromMetadata,
  settingsToMetadata,
  type ThemePreference,
} from "./settings";

describe("normalizeDisplayName", () => {
  it("trims a display name", () => {
    expect(normalizeDisplayName("  Ada Lovelace  ")).toBe("Ada Lovelace");
  });

  it("caps overly long names", () => {
    expect(normalizeDisplayName("a".repeat(80))).toBe("a".repeat(60));
  });

  it("rejects blank or non-string values", () => {
    expect(normalizeDisplayName("   ")).toBeUndefined();
    expect(normalizeDisplayName(12)).toBeUndefined();
    expect(normalizeDisplayName(null)).toBeUndefined();
  });
});

describe("parseThemePreference", () => {
  it("accepts the supported themes", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });

  it("ignores unknown values", () => {
    expect(parseThemePreference("system")).toBeUndefined();
    expect(parseThemePreference(true)).toBeUndefined();
  });
});

describe("settingsFromMetadata", () => {
  it("reads the persisted profile and preferences", () => {
    expect(
      settingsFromMetadata({
        display_name: " Grace Hopper ",
        currency: "EUR",
        theme: "dark",
      }),
    ).toEqual({ displayName: "Grace Hopper", currency: "EUR", theme: "dark" });
  });

  it("ignores invalid metadata and tolerates missing metadata", () => {
    expect(
      settingsFromMetadata({
        display_name: "  ",
        currency: "XXX",
        theme: "neon",
      }),
    ).toEqual({});
    expect(settingsFromMetadata(null)).toEqual({});
    expect(settingsFromMetadata(undefined)).toEqual({});
  });
});

describe("settingsToMetadata", () => {
  it("maps settings onto auth user metadata", () => {
    expect(
      settingsToMetadata({
        displayName: " Ada Lovelace ",
        currency: "GBP",
        theme: "dark",
      }),
    ).toEqual({ display_name: "Ada Lovelace", currency: "GBP", theme: "dark" });
  });

  it("falls back to safe values for invalid input", () => {
    expect(
      settingsToMetadata({
        displayName: " ",
        currency: "XXX" as unknown as CurrencyCode,
        theme: "neon" as unknown as ThemePreference,
      }),
    ).toEqual({ display_name: "", currency: "USD", theme: "light" });
  });
});
