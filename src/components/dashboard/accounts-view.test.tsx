import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Account } from "@/types/account";
import type { Transfer } from "@/types/transfer";
import { AccountsView } from "./accounts-view";

const { mockUseAccounts, mockUseTransfers, mockUseSession } = vi.hoisted(
  () => ({
    mockUseAccounts: vi.fn(),
    mockUseTransfers: vi.fn(),
    mockUseSession: vi.fn(),
  }),
);

vi.mock("@/components/use-accounts", () => ({ useAccounts: mockUseAccounts }));
vi.mock("@/components/use-transfers", () => ({
  useTransfers: mockUseTransfers,
}));
vi.mock("@/components/auth/session-provider", () => ({
  useSession: mockUseSession,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const ACCOUNTS: Account[] = [
  {
    id: "acc-checking",
    name: "Everyday checking",
    kind: "checking",
    openingBalance: 200000,
    color: "#059669",
  },
  {
    id: "acc-savings",
    name: "Savings",
    kind: "savings",
    openingBalance: 1000000,
    color: "#2563eb",
  },
];

const TRANSFER: Transfer = {
  id: "tr-1",
  fromAccountId: "acc-checking",
  toAccountId: "acc-savings",
  amount: 50000,
  note: "Monthly saving",
  occurredOn: "2026-09-01",
};

function readyState(accounts: Account[], reload = vi.fn()) {
  return { status: "ready" as const, accounts, error: null, reload };
}

beforeEach(() => {
  stubMatchMedia(true);
  mockUseAccounts.mockReset();
  mockUseAccounts.mockReturnValue(readyState(ACCOUNTS));
  mockUseTransfers.mockReset();
  mockUseTransfers.mockReturnValue([]);
  mockUseSession.mockReset();
  mockUseSession.mockReturnValue({ user: { id: "user-1" } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AccountsView", () => {
  it("renders each account with its balance and a total", () => {
    render(<AccountsView />);

    expect(screen.getByRole("heading", { name: "Accounts" })).toBeInTheDocument();
    expect(screen.getByText("Everyday checking")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Savings" })).toBeInTheDocument();
    expect(screen.getByText("$2,000.00")).toBeInTheDocument();
    expect(screen.getByText("$10,000.00")).toBeInTheDocument();
    expect(screen.getByText("$12,000.00")).toBeInTheDocument();
    expect(screen.getByText("2 accounts")).toBeInTheDocument();
  });

  it("applies transfers to the account balances", () => {
    mockUseTransfers.mockReturnValue([TRANSFER]);

    render(<AccountsView />);

    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
    expect(screen.getByText("$10,500.00")).toBeInTheDocument();
    expect(screen.getByText("$12,000.00")).toBeInTheDocument();
    expect(screen.getByText("Monthly saving")).toBeInTheDocument();
    expect(
      screen.getByText(/Everyday checking → Savings/),
    ).toBeInTheDocument();
  });

  it("shows a placeholder while the accounts load", () => {
    mockUseAccounts.mockReturnValue({
      status: "loading",
      accounts: null,
      error: null,
      reload: vi.fn(),
    });

    render(<AccountsView />);

    expect(
      screen.getByRole("status", { name: "Loading accounts" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /new account/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /transfer/i }),
    ).toBeDisabled();
  });

  it("shows the failure with a retry that reloads the accounts", async () => {
    const reload = vi.fn();
    mockUseAccounts.mockReturnValue({
      status: "error",
      accounts: null,
      error: {
        message: "Failed to fetch accounts",
      } as unknown as PostgrestError,
      reload,
    });

    render(<AccountsView />);

    expect(
      screen.getByText("Could not load your accounts"),
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch accounts")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("shows an empty state when there are no accounts", () => {
    mockUseAccounts.mockReturnValue(readyState([]));

    render(<AccountsView />);

    expect(screen.getByText("No accounts yet")).toBeInTheDocument();
  });

  it("opens the transfer dialog when there are two accounts", async () => {
    render(<AccountsView />);

    await userEvent.click(screen.getByRole("button", { name: /transfer/i }));

    expect(
      await screen.findByRole("dialog", { name: "Transfer money" }),
    ).toBeInTheDocument();
  });
});
