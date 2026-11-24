import { describe, expect, it } from "vitest";
import { PWA_CACHE_NAME, PWA_OFFLINE_PATH } from "@/lib/pwa/shell";
import { GET } from "./route";

describe("service worker route", () => {
  it("serves the worker script as JavaScript with no-store caching", async () => {
    const response = GET();

    expect(response.headers.get("content-type")).toContain(
      "application/javascript",
    );
    expect(response.headers.get("cache-control")).toContain("no-cache");
    expect(response.headers.get("service-worker-allowed")).toBe("/");

    const script = await response.text();
    expect(script).toContain(PWA_CACHE_NAME);
    expect(script).toContain(PWA_OFFLINE_PATH);
  });
});
