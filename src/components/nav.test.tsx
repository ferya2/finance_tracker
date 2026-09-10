import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/components/auth/session-provider";
import { Nav } from "./nav";

const { mockGetSession, mockOnAuthStateChange, mockSignOut } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSession: mockGetSession,
  onAuthStateChange: mockOnAuthStateChange,
  signOut: mockSignOut,
}));

let authListener: ((event: string, session: unknown) => void) | null = null;

function renderNav() {
  return render(
    <SessionProvider>
      <Nav />
    </SessionProvider>,
  );
}

beforeEach(() => {
  mockGetSession.mockReset();
  mockOnAuthStateChange.mockReset();
  mockSignOut.mockReset();
  authListener = null;
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  mockOnAuthStateChange.mockImplementation((callback) => {
    authListener = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
});

describe("Nav", () => {
  it("renders anchors for the landing sections and auth pages while signed out", async () => {
    renderNav();

    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute(
      "href",
      "#features",
    );
    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute(
      "href",
      "#how-it-works",
    );
    expect(await screen.findByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/sign-up",
    );
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });

  it("replaces the auth links with a log out control when a session exists", async () => {
    renderNav();
    await screen.findByRole("link", { name: "Sign up" });

    await act(async () => {
      authListener?.("SIGNED_IN", {
        user: { id: "user-1", email: "ada@example.com" },
      });
    });

    expect(
      await screen.findByRole("button", { name: "Log out" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("returns to the auth links after logging out", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const user = userEvent.setup();

    renderNav();
    await screen.findByRole("link", { name: "Sign up" });
    await act(async () => {
      authListener?.("SIGNED_IN", {
        user: { id: "user-1", email: "ada@example.com" },
      });
    });

    await user.click(
      await screen.findByRole("button", { name: "Log out" }),
    );

    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(await screen.findByRole("link", { name: "Sign up" })).toBeInTheDocument();
  });
});