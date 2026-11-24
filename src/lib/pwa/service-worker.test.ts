import { Script } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  PWA_ASSET_PATHS,
  PWA_CACHE_NAME,
  PWA_OFFLINE_PATH,
  PWA_SHELL_PATHS,
} from "@/lib/pwa/shell";
import { buildServiceWorkerScript } from "./service-worker";

describe("buildServiceWorkerScript", () => {
  const script = buildServiceWorkerScript();

  it("generates valid JavaScript", () => {
    expect(() => new Script(script)).not.toThrow();
  });

  it("installs, activates and fetches through a service worker", () => {
    expect(script).toContain('self.addEventListener("install"');
    expect(script).toContain('self.addEventListener("activate"');
    expect(script).toContain('self.addEventListener("fetch"');
    expect(script).toContain("self.skipWaiting()");
    expect(script).toContain("self.clients.claim()");
  });

  it("precaches the offline shell and its assets", () => {
    expect(script).toContain(`const CACHE = "${PWA_CACHE_NAME}"`);
    for (const path of [...PWA_SHELL_PATHS, ...PWA_ASSET_PATHS]) {
      expect(script).toContain(`"${path}"`);
    }
    expect(script).toContain(`const FALLBACK = "${PWA_OFFLINE_PATH}"`);
  });

  it("serves the offline page when navigation fails", () => {
    expect(script).toContain('request.mode === "navigate"');
    expect(script).toContain("cache.match(FALLBACK)");
    expect(script).toContain("Response.error()");
  });

  it("does not cache private app routes", () => {
    expect(script).not.toContain("/dashboard");
    expect(script).toContain('url.pathname.indexOf("/api/") === 0');
    expect(script).toContain("url.origin !== self.location.origin");
  });
});
