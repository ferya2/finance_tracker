import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseClient,
  getSupabaseClient,
  signInWithPassword,
  signOut,
  signUp,
} from "./client";

const { mockAuth, mockCreateClient } = vi.hoisted(() => ({
  mockAuth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  mockCreateClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

beforeEach(() => {
  mockCreateClient.mockReset();
  mockAuth.signUp.mockReset();
  mockAuth.signInWithPassword.mockReset();
  mockAuth.signOut.mockReset();
  mockCreateClient.mockReturnValue({ auth: mockAuth });
});

describe("createSupabaseClient", () => {
  it("creates a client with the given url and anon key", () => {
    const client = createSupabaseClient(
      "https://example.supabase.co",
      "anon-key",
    );

    expect(client).toBeDefined();
    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
    );
  });
});

describe("getSupabaseClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when the env vars are not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);

    expect(() => getSupabaseClient()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("creates a client from the configured env vars", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    const client = getSupabaseClient();

    expect(client).toBeDefined();
    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
    );
  });
});

describe("auth helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("signs a user up with email and password", async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const result = await signUp({ email: "a@b.com", password: "secret" });

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret",
    });
    expect(result).toEqual({ data: { user: { id: "user-1" } }, error: null });
  });

  it("signs a user in with email and password", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const result = await signInWithPassword({
      email: "a@b.com",
      password: "secret",
    });

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "a@b.com",
      password: "secret",
    });
    expect(result).toEqual({ data: { user: { id: "user-1" } }, error: null });
  });

  it("signs the current user out", async () => {
    mockAuth.signOut.mockResolvedValue({ error: null });

    const result = await signOut();

    expect(mockAuth.signOut).toHaveBeenCalledOnce();
    expect(result).toEqual({ error: null });
  });
});