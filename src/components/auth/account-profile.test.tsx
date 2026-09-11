import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/components/auth/session-provider";
import { AccountProfile } from "./account-profile";

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

function renderProfile() {
  return render(
    <SessionProvider>
      <AccountProfile />
    </SessionProvider>,
  );
}

beforeEach(() => {
  mockGetSession.mockReset();
  mockOnAuthStateChange.mockReset();
  mockSignOut.mockReset();
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  mockOnAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }));
});

describe("AccountProfile", () => {
  it("shows a loading placeholder while the session settles", () => {
    renderProfile();

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading account",
    );
  });

  it("shows the signed-in user's email and initials", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-ada", email: "ada.lovelace@example.com" } },
      },
      error: null,
    });

    renderProfile();

    expect(
      await screen.findAllByText("ada.lovelace@example.com"),
    ).not.toHaveLength(0);
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("shows the member id in its short form", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "1234567890abcdef1234567890", email: "ada@example.com" } },
      },
      error: null,
    });

    renderProfile();

    expect(await screen.findByText("12345678…")).toBeInTheDocument();
  });

  it("falls back to a generic label when the email is missing", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "user-ada" } } },
      error: null,
    });

    renderProfile();

    expect(await screen.findByText("Finance Tracker User")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("prompts signed-out visitors to log in", async () => {
    renderProfile();

    expect(await screen.findByText(/not signed in/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});