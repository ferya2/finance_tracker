import { describe, expect, it } from "vitest";
import {
  ACCENT_PALETTES,
  DEFAULT_ACCENT_COLOR,
  accentPalette,
  isAccentColor,
  parseAccentSetting,
  sanitizeAccentColor,
} from "./accent-color";

describe("isAccentColor", () => {
  it("accepts every preset id", () => {
    for (const palette of ACCENT_PALETTES) {
      expect(isAccentColor(palette.id)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isAccentColor("neon")).toBe(false);
    expect(isAccentColor("")).toBe(false);
    expect(isAccentColor(1)).toBe(false);
    expect(isAccentColor(null)).toBe(false);
  });
});

describe("sanitizeAccentColor", () => {
  it("keeps a supported accent", () => {
    expect(sanitizeAccentColor("violet")).toBe("violet");
  });

  it("falls back to the default", () => {
    expect(sanitizeAccentColor("neon")).toBe(DEFAULT_ACCENT_COLOR);
    expect(sanitizeAccentColor(undefined)).toBe(DEFAULT_ACCENT_COLOR);
  });
});

describe("parseAccentSetting", () => {
  it("reads and trims a stored accent", () => {
    expect(parseAccentSetting("  amber  ")).toBe("amber");
  });

  it("falls back for empty or malformed storage", () => {
    expect(parseAccentSetting(null)).toBe(DEFAULT_ACCENT_COLOR);
    expect(parseAccentSetting("")).toBe(DEFAULT_ACCENT_COLOR);
    expect(parseAccentSetting("lime")).toBe(DEFAULT_ACCENT_COLOR);
  });
});

describe("accentPalette", () => {
  it("returns the matching palette", () => {
    expect(accentPalette("rose").label).toBe("Rose");
    expect(accentPalette("blue").light).toBe("#2563eb");
  });

  it("returns the default palette for an invalid value", () => {
    expect(accentPalette("neon")).toBe(accentPalette(DEFAULT_ACCENT_COLOR));
  });
});
