import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionProvider } from "@/components/auth/session-provider";
import { AccountView } from "./account-view";

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

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

beforeEach(() => {
  mockGetSession.mockReset();
  mockOnAuthStateChange.mockReset();
  mockSignOut.mockReset();
  mockGetSession.mockResolvedValue({
    data: {
      session: { user: { id: "user-1", email: "ada@example.com" } },
    },
    error: null,
  });
  mockOnAuthStateChange.mockImplementation(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  }));
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AccountView", () => {
  it("renders the account header with dummy stat tiles", () => {
    render(
      <SessionProvider>
        <AccountView />
      </SessionProvider>,
    );

    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("Budgets")).toBeInTheDocument();
  });

  it("shows the signed-in profile from the session", async () => {
    render(
      <SessionProvider>
        <AccountView />
      </SessionProvider>,
    );

    expect(
      (await screen.findAllByText("ada@example.com")).length,
    ).toBeGreaterThanOrEqual(1);
  });
});