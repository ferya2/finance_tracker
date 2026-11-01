import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PostgrestError } from "@supabase/supabase-js";
import { RecurringView } from "./recurring-view";
import {
  RECURRING_STORAGE_PREFIX,
  recurringStorageKey,
} from "@/lib/storage/recurring";
import type { UserData } from "@/lib/supabase/dashboard";
import type { RecurringTransaction } from "@/types/recurring";

const { mockUseUserData, mockUseSession } = vi.hoisted(() => ({
  mockUseUserData: vi.fn(),
  mockUseSession: vi.fn(),
}));

vi.mock("@/components/use-user-data", () => ({ useUserData: mockUseUserData }));
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

const DATA: UserData = {
  transactions: [],
  categories: [
    { id: "cat-housing", name: "Housing", color: "#d97706", kind: "expense" },
    { id: "cat-food", name: "Food & dining", color: "#e11d48", kind: "expense" },
  ],
  budgets: [],
};

const RENT: RecurringTransaction = {
  id: "rec-rent",
  amount: 120000,
  type: "expense",
  categoryId: "cat-housing",
  note: "Rent",
  startOn: "2026-01-01",
  frequency: "monthly",
  interval: 1,
};

const SALARY: RecurringTransaction = {
  id: "rec-salary",
  amount: 500000,
  type: "income",
  categoryId: "cat-food",
  note: "Salary",
  startOn: "2026-01-15",
  frequency: "monthly",
  interval: 1,
};

function readyState(data: UserData, reload = vi.fn()) {
  return { status: "ready" as const, data, error: null, reload };
}

function seed(entries: RecurringTransaction[], userId = "user-1") {
  localStorage.setItem(recurringStorageKey(userId), JSON.stringify(entries));
}

function stored(userId = "user-1"): RecurringTransaction[] {
  const raw = localStorage.getItem(recurringStorageKey(userId));
  return raw ? (JSON.parse(raw) as RecurringTransaction[]) : [];
}

beforeEach(() => {
  stubMatchMedia(true);
  localStorage.clear();
  mockUseUserData.mockReset();
  mockUseUserData.mockReturnValue(readyState(DATA));
  mockUseSession.mockReset();
  mockUseSession.mockReturnValue({ user: { id: "user-1" } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("RecurringView", () => {
  it("shows an empty state when the user has no plans", async () => {
    render(<RecurringView />);

    expect(
      await screen.findByText("No recurring plans yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add recurring plan/i }),
    ).toBeInTheDocument();
  });

  it("lists saved plans with their category and schedule", async () => {
    seed([RENT, SALARY]);

    render(<RecurringView />);

    expect(await screen.findByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Housing · Every month")).toBeInTheDocument();
    expect(screen.getByText(/1,200\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\+\$5,000\.00/)).toBeInTheDocument();
    expect(screen.getAllByText(/^Next /)).toHaveLength(2);
    expect(screen.getByText(/2 plans/)).toBeInTheDocument();
    expect(screen.getByText(/2 active/)).toBeInTheDocument();
  });

  it("adds a plan and saves it for the current user", async () => {
    const user = userEvent.setup();
    render(<RecurringView />);

    await screen.findByText("No recurring plans yet");
    await user.click(screen.getByRole("button", { name: "Add plan" }));
    await user.selectOptions(screen.getByLabelText("Category"), "cat-food");
    await user.type(screen.getByLabelText("Amount"), "25.50");
    await user.type(screen.getByLabelText(/Note/), "Lunch club");
    await user.click(screen.getByRole("button", { name: "Create plan" }));

    expect(await screen.findByText("Lunch club")).toBeInTheDocument();
    expect(screen.getByText("Added Lunch club.")).toBeInTheDocument();

    const entries = stored();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      amount: 2550,
      type: "expense",
      categoryId: "cat-food",
      note: "Lunch club",
      frequency: "monthly",
      interval: 1,
    });
  });

  it("edits a plan and writes the correction back", async () => {
    seed([RENT]);
    const user = userEvent.setup();
    render(<RecurringView />);

    await screen.findByText("Rent");
    await user.click(screen.getByRole("button", { name: "Edit Rent" }));
    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "1300");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText(/1,300\.00/)).toBeInTheDocument();
    expect(screen.getByText("Updated Rent.")).toBeInTheDocument();
    expect(stored()[0]).toMatchObject({ id: "rec-rent", amount: 130000 });
  });

  it("deletes a plan after confirmation", async () => {
    seed([RENT]);
    const user = userEvent.setup();
    render(<RecurringView />);

    await screen.findByText("Rent");
    await user.click(screen.getByRole("button", { name: "Delete Rent" }));
    expect(
      screen.getByRole("dialog", { name: "Delete recurring plan?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete plan" }));

    expect(await screen.findByText("No recurring plans yet")).toBeInTheDocument();
    expect(screen.getByText("Deleted Rent.")).toBeInTheDocument();
    expect(stored()).toEqual([]);
  });

  it("shows the category failure with a retry", async () => {
    const reload = vi.fn();
    mockUseUserData.mockReturnValue({
      status: "error",
      data: null,
      error: { message: "Failed to fetch categories" } as unknown as PostgrestError,
      reload,
    });

    render(<RecurringView />);

    expect(
      screen.getByText("Could not load your categories"),
    ).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch categories")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reload).toHaveBeenCalledOnce();
  });

  it("keeps each user's plans separate", async () => {
    seed([RENT], "user-1");
    seed([SALARY], "user-2");

    mockUseSession.mockReturnValue({ user: { id: "user-2" } });
    render(<RecurringView />);

    expect(await screen.findByText("Salary")).toBeInTheDocument();
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();
  });

  it("ignores a corrupt stored payload", async () => {
    localStorage.setItem(
      `${RECURRING_STORAGE_PREFIX}:user-1`,
      "not valid json",
    );

    render(<RecurringView />);

    await waitFor(() =>
      expect(screen.getByText("No recurring plans yet")).toBeInTheDocument(),
    );
  });
});
