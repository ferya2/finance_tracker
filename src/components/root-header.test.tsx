import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionProvider } from "@/components/auth/session-provider";
import { RootHeader } from "./root-header";

const { mockUsePathname, mockGetSession, mockOnAuthStateChange, mockSignOut } =
  vi.hoisted(() => ({
    mockUsePathname: vi.fn(),
    mockGetSession: vi.fn(),
    mockOnAuthStateChange: vi.fn(),
    mockSignOut: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
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

describe("RootHeader", () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockSignOut.mockReset();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));
    stubMatchMedia(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderHeader(pathname: string) {
    mockUsePathname.mockReturnValue(pathname);
    return render(
      <SessionProvider>
        <RootHeader />
      </SessionProvider>,
    );
  }

  it("renders the landing header on public pages", async () => {
    renderHeader("/");

    expect(
      await screen.findByRole("link", { name: "Features" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Finance Tracker")).toBeInTheDocument();
  });

  it("renders nothing inside the authed dashboard shell", () => {
    const { container } = renderHeader("/dashboard");

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText("Finance Tracker")).not.toBeInTheDocument();
  });
});