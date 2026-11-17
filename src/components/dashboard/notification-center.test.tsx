import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserData } from "@/lib/supabase/dashboard";
import type { RecurringTransaction } from "@/types/recurring";
import { NotificationCenter } from "./notification-center";

const { mockUseUserData, mockUseRecurringEntries } = vi.hoisted(() => ({
  mockUseUserData: vi.fn(),
  mockUseRecurringEntries: vi.fn(),
}));

vi.mock("@/components/auth/session-provider", () => ({
  useSession: () => ({
    status: "ready",
    user: { id: "user-1", email: "ada@example.com" },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/components/use-user-data", () => ({ useUserData: mockUseUserData }));
vi.mock("@/components/use-recurring-entries", () => ({
  useRecurringEntries: mockUseRecurringEntries,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
  2,
  "0",
)}-${String(now.getDate()).padStart(2, "0")}`;
const thisMonth = today.slice(0, 7);

const OVER_BUDGET_DATA: UserData = {
  transactions: [
    {
      id: "txn-1",
      amount: 15000,
      type: "expense",
      categoryId: "cat-food",
      note: "Groceries",
      occurredOn: today,
    },
  ],
  categories: [
    { id: "cat-food", name: "Food", color: "#e11d48", kind: "expense" },
  ],
  budgets: [
    {
      id: "budget-food",
      categoryId: "cat-food",
      month: thisMonth,
      limitAmount: 10000,
    },
  ],
};

const RECURRING: RecurringTransaction = {
  id: "rec-1",
  amount: 2500,
  type: "expense",
  categoryId: "cat-food",
  note: "Rent",
  startOn: today,
  frequency: "monthly",
  interval: 1,
};

function ready(data: UserData) {
  mockUseUserData.mockReturnValue({
    status: "ready",
    data,
    error: null,
    reload: vi.fn(),
  });
}

beforeEach(() => {
  mockUseUserData.mockReset();
  mockUseRecurringEntries.mockReset();
  ready({ transactions: [], categories: [], budgets: [] });
  mockUseRecurringEntries.mockReturnValue([]);
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("NotificationCenter", () => {
  it("opens an all-caught-up panel when there is nothing to report", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    const dialog = screen.getByRole("dialog", { name: "Notifications" });
    expect(within(dialog).getByText("All caught up")).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Clear all" }),
    ).not.toBeInTheDocument();
  });

  it("lists budget warnings and upcoming reminders with links", async () => {
    ready(OVER_BUDGET_DATA);
    mockUseRecurringEntries.mockReturnValue([RECURRING]);
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(
      screen.getByRole("button", { name: "Notifications (2)" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Notifications" });
    const budget = within(dialog).getByRole("link", {
      name: /Food is over budget/,
    });
    const reminder = within(dialog).getByRole("link", {
      name: /Upcoming payment · Rent/,
    });

    expect(budget).toHaveAttribute("href", "/dashboard/budgets");
    expect(reminder).toHaveAttribute("href", "/dashboard/recurring");
    expect(
      within(dialog).getByText(/Over by \$50\.00/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("$25.00 due today")).toBeInTheDocument();
  });

  it("clears every visible notification", async () => {
    ready(OVER_BUDGET_DATA);
    mockUseRecurringEntries.mockReturnValue([RECURRING]);
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(
      screen.getByRole("button", { name: "Notifications (2)" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Notifications" });
    await user.click(within(dialog).getByRole("button", { name: "Clear all" }));

    expect(within(dialog).getByText("All caught up")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  it("closes the panel on Escape", async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(
      screen.getByRole("dialog", { name: "Notifications" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Notifications" }),
    ).not.toBeInTheDocument();
  });

  it("shows a loading state while data is still arriving", async () => {
    mockUseUserData.mockReturnValue({
      status: "loading",
      data: null,
      error: null,
      reload: vi.fn(),
    });
    const user = userEvent.setup();
    render(<NotificationCenter />);

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(
      screen.getByRole("status", { name: "Loading notifications" }),
    ).toBeInTheDocument();
  });
});
