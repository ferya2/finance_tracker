import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "@/components/auth/session-provider";
import { AppShell } from "./app-shell";

const {
  mockUsePathname,
  mockGetSession,
  mockOnAuthStateChange,
  mockSignOut,
} = vi.hoisted(() => ({
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

afterEach(() => {
  vi.unstubAllGlobals();
});

const navItems: Array<[string, string]> = [
  ["Dashboard", "/dashboard"],
  ["Transactions", "/dashboard/transactions"],
  ["Categories", "/dashboard/categories"],
  ["Budgets", "/dashboard/budgets"],
  ["Reports", "/dashboard/reports"],
  ["Insights", "/dashboard/insights"],
  ["Settings", "/dashboard/settings"],
  ["Account", "/dashboard/account"],
];

function renderShell(pathname = "/dashboard") {
  mockUsePathname.mockReturnValue(pathname);
  return render(
    <SessionProvider>
      <AppShell>Shell content</AppShell>
    </SessionProvider>,
  );
}

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

describe("AppShell", () => {
  it("links every planned area from the sidebar", () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1", email: "ada@example.com" } },
      },
      error: null,
    });
    renderShell();

    for (const [label, href] of navItems) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    }
    expect(screen.getByText("Shell content")).toBeInTheDocument();
  });

  it("marks the current page as active", () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1", email: "ada@example.com" } },
      },
      error: null,
    });
    renderShell("/dashboard/transactions");

    expect(
      screen.getByRole("link", { name: "Transactions" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("flags Dashboard as active on the root dashboard route", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1", email: "ada@example.com" } },
      },
      error: null,
    });
    renderShell("/dashboard");

    expect(
      await screen.findByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("shows a log out control for signed-in users", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1", email: "ada@example.com" } },
      },
      error: null,
    });
    renderShell();

    expect(
      await screen.findByRole("button", { name: "Log out" }),
    ).toBeInTheDocument();
  });

  it("opens the mobile menu drawer with navigation", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: { user: { id: "user-1", email: "ada@example.com" } },
      },
      error: null,
    });
    mockSignOut.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(
      await screen.findByRole("dialog", { name: "Menu" }),
    ).toBeInTheDocument();
  });
});