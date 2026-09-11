import { describe, expect, it } from "vitest";
import type { AuthUser } from "./session";
import {
  DEFAULT_DISPLAY_NAME,
  getDisplayName,
  getProfileInitials,
  getShortId,
  UNKNOWN_INITIALS,
} from "./account";

const user = (overrides: Partial<AuthUser>): AuthUser => ({
  id: "user-1",
  ...overrides,
});

describe("getProfileInitials", () => {
  it("uses the first letters of the email local part", () => {
    expect(getProfileInitials(user({ email: "ada@example.com" }))).toBe("A");
    expect(
      getProfileInitials(user({ email: "ada.lovelace@example.com" })),
    ).toBe("AL");
  });

  it("ignores separators and numbers in the local part", () => {
    expect(
      getProfileInitials(user({ email: "a.lovelace90@example.com" })),
    ).toBe("AL");
  });

  it("falls back to a placeholder when the email is missing", () => {
    expect(getProfileInitials(user({}))).toBe(UNKNOWN_INITIALS);
  });
});

describe("getDisplayName", () => {
  it("returns the user's email when present", () => {
    expect(
      getDisplayName(user({ email: "ada@example.com" })),
    ).toBe("ada@example.com");
  });

  it("falls back to a generic label when the email is missing", () => {
    expect(getDisplayName(user({}))).toBe(DEFAULT_DISPLAY_NAME);
  });
});

describe("getShortId", () => {
  it("keeps short ids unchanged", () => {
    expect(getShortId("user-1")).toBe("user-1");
  });

  it("truncates long ids with an ellipsis", () => {
    expect(getShortId("1234567890abcdef1234567890")).toBe("12345678…");
  });
});