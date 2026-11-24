import { describe, expect, it } from "vitest";
import {
  PWA_ASSET_PATHS,
  PWA_CACHE_NAME,
  PWA_OFFLINE_PATH,
  PWA_SHELL_PATHS,
  isPwaPrecachePath,
  isPwaShellPath,
  isPwaStaticAssetPath,
} from "./shell";

describe("PWA shell paths", () => {
  it("keeps the public shell limited to landing and auth pages", () => {
    expect(PWA_SHELL_PATHS).toEqual([
      "/",
      "/login",
      "/sign-up",
      "/offline.html",
    ]);
    expect(isPwaShellPath("/")).toBe(true);
    expect(isPwaShellPath("/login")).toBe(true);
    expect(isPwaShellPath("/sign-up")).toBe(true);
    expect(isPwaShellPath(PWA_OFFLINE_PATH)).toBe(true);
  });

  it("never treats private or dynamic routes as shell pages", () => {
    expect(isPwaShellPath("/dashboard")).toBe(false);
    expect(isPwaShellPath("/dashboard/settings")).toBe(false);
    expect(isPwaShellPath("/login?next=/dashboard")).toBe(false);
  });

  it("precaches only the shell and its manifest/icons", () => {
    for (const path of PWA_ASSET_PATHS) {
      expect(isPwaPrecachePath(path)).toBe(true);
    }
    expect(isPwaPrecachePath("/")).toBe(true);
    expect(isPwaPrecachePath("/_next/static/chunks/main.js")).toBe(false);
    expect(isPwaPrecachePath("/api/auth")).toBe(false);
  });

  it("caches static build assets but leaves dynamic responses alone", () => {
    expect(isPwaStaticAssetPath("/_next/static/chunks/main.js")).toBe(true);
    expect(isPwaStaticAssetPath("/_next/static/media/font.woff2")).toBe(true);
    expect(isPwaStaticAssetPath(PWA_ASSET_PATHS[0])).toBe(true);
    expect(isPwaStaticAssetPath("/dashboard")).toBe(false);
    expect(isPwaStaticAssetPath("/api/transactions")).toBe(false);
  });

  it("uses a versioned cache so old shells can be removed", () => {
    expect(PWA_CACHE_NAME).toBe("finance-tracker-shell-v1");
  });
});
