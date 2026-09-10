import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "./session-provider";

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
let unsubscribe: ReturnType<typeof vi.fn>;

function Consumer() {
  const { status, user, signOut } = useSession();
  return (
    <div>
      <output data-testid="status">{status}</output>
      <output data-testid="user">{user?.email ?? "none"}</output>
      <button type="button" onClick={() => void signOut()}>
        Log out
      </button>
    </div>
  );
}

function renderConsumer() {
  return render(
    <SessionProvider>
      <Consumer />
    </SessionProvider>,
  );
}

beforeEach(() => {
  mockGetSession.mockReset();
  mockOnAuthStateChange.mockReset();
  mockSignOut.mockReset();
  authListener = null;
  unsubscribe = vi.fn();
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  mockOnAuthStateChange.mockImplementation((callback) => {
    authListener = callback;
    return { data: { subscription: { unsubscribe } } };
  });
});

describe("SessionProvider", () => {
  it("starts in loading state and settles to signedOut when no session is stored", async () => {
    renderConsumer();

    expect(screen.getByTestId("status")).toHaveTextContent("loading");
    expect(await screen.findByText("signedOut")).toBeInTheDocument();
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("restores a signed-in session from getSession", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1", email: "ada@example.com" } },
      },
      error: null,
    });

    renderConsumer();

    expect(await screen.findByText("signedIn")).toBeInTheDocument();
    expect(screen.getByTestId("user")).toHaveTextContent("ada@example.com");
  });

  it("reacts to auth state changes (login and logout)", async () => {
    renderConsumer();
    await screen.findByText("signedOut");

    await act(async () => {
      authListener?.("SIGNED_IN", {
        user: { id: "user-1", email: "ada@example.com" },
      });
    });
    expect(screen.getByTestId("status")).toHaveTextContent("signedIn");

    await act(async () => {
      authListener?.("SIGNED_OUT", null);
    });
    expect(screen.getByTestId("status")).toHaveTextContent("signedOut");
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("calls Supabase signOut and clears the session", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1", email: "ada@example.com" } },
      },
      error: null,
    });
    const user = userEvent.setup();

    renderConsumer();
    await user.click(await screen.findByRole("button", { name: "Log out" }));

    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(await screen.findByText("signedOut")).toBeInTheDocument();
  });

  it("unsubscribes from auth state changes on unmount", () => {
    const { unmount } = renderConsumer();

    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("throws when useSession is used outside a provider", () => {
    const originalConsoleError = console.error;
    console.error = vi.fn();
    try {
      expect(() => render(<Consumer />)).toThrow(/SessionProvider/);
    } finally {
      console.error = originalConsoleError;
    }
  });
});