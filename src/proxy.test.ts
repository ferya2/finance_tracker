import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

describe("proxy", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  async function run(pathname: string, user: { id: string } | null) {
    mockGetUser.mockResolvedValue({ data: { user } });
    const request = new NextRequest(new URL(pathname, "https://example.com"));
    return proxy(request);
  }

  it("redirects unauthenticated users from /app to /login", async () => {
    const response = await run("/app", null);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/login");
  });

  it("redirects unauthenticated users from nested /app routes to /login", async () => {
    const response = await run("/app/settings", null);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/login");
  });

  it("redirects authenticated users away from /login to /app", async () => {
    const response = await run("/login", { id: "user-1" });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/app");
  });

  it("redirects authenticated users away from /sign-up to /app", async () => {
    const response = await run("/sign-up", { id: "user-1" });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/app");
  });

  it("passes through for authenticated users on /app", async () => {
    const response = await run("/app", { id: "user-1" });

    expect(response.status).toBe(200);
  });

  it("passes through for the public landing page when signed out", async () => {
    const response = await run("/", null);

    expect(response.status).toBe(200);
  });

  it("passes through for the login page when signed out", async () => {
    const response = await run("/login", null);

    expect(response.status).toBe(200);
  });
});