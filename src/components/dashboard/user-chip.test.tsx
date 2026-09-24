import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "@/components/auth/session-provider";
import { UserChip } from "./user-chip";

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

function renderChip() {
  return render(
    <SessionProvider>
      <UserChip />
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

describe("UserChip", () => {
  it("shows a loading placeholder while the session settles", () => {
    renderChip();

    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading user",
    );
  });

  it("shows the signed-in user's initials and email", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-ada", email: "ada.lovelace@example.com" },
        },
      },
      error: null,
    });

    renderChip();

    expect(await screen.findByText("ada.lovelace@example.com")).toBeInTheDocument();
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("links to the account page", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-ada", email: "ada@example.com" } },
      },
      error: null,
    });

    renderChip();

    expect(
      await screen.findByRole("link", { name: "Account: ada@example.com" }),
    ).toHaveAttribute("href", "/dashboard/account");
  });

  it("renders nothing when the user is signed out", async () => {
    renderChip();

    await vi.waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /^Account:/ }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});