import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { onboardingStorageKey } from "@/lib/storage/onboarding";
import { OnboardingWizard } from "./onboarding-wizard";

const {
  mockLoadUserData,
  mockFrom,
  mockSelect,
  mockOrder,
  mockInsert,
  mockInsertSelect,
} = vi.hoisted(() => ({
  mockLoadUserData: vi.fn(),
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockOrder: vi.fn(),
  mockInsert: vi.fn(),
  mockInsertSelect: vi.fn(),
}));

vi.mock("@/lib/supabase/dashboard", () => ({
  loadUserData: mockLoadUserData,
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({ from: mockFrom }),
}));

function stubMatchMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function renderWizard(userId = "user-1") {
  return render(<OnboardingWizard userId={userId} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  stubMatchMedia();

  mockLoadUserData.mockResolvedValue({
    data: { transactions: [], categories: [], budgets: [] },
    error: null,
  });
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockInsertSelect.mockResolvedValue({ data: [], error: null });
  mockSelect.mockReturnValue({ order: mockOrder });
  mockInsert.mockReturnValue({ select: mockInsertSelect });
  mockFrom.mockImplementation((table: string) => {
    if (table !== "categories") throw new Error(`Unexpected table: ${table}`);
    return { select: mockSelect, insert: mockInsert };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("OnboardingWizard", () => {
  it("guides a first-run user through setup and remembers completion", async () => {
    const user = userEvent.setup();
    renderWizard();

    expect(
      await screen.findByRole("dialog", { name: "Welcome to Finance Tracker" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Setup progress" }),
    ).toHaveAttribute("aria-valuenow", "1");

    await user.click(screen.getByRole("button", { name: "Get started" }));
    expect(
      await screen.findByRole("heading", { name: "Start with the essentials" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Add starter categories" }),
    );
    expect(
      await screen.findByRole("heading", { name: "You're ready to track" }),
    ).toBeInTheDocument();
    expect(mockInsert).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Finish setup" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(window.localStorage.getItem(onboardingStorageKey("user-1"))).toBe(
      "completed",
    );
  });

  it("stays hidden once setup has been completed", () => {
    window.localStorage.setItem(onboardingStorageKey("user-1"), "completed");
    renderWizard();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockLoadUserData).not.toHaveBeenCalled();
  });

  it("does not interrupt a returning user who already has data", async () => {
    mockLoadUserData.mockResolvedValue({
      data: {
        transactions: [{ id: "transaction-1" }],
        categories: [],
        budgets: [],
      },
      error: null,
    });
    renderWizard();

    await waitFor(() => expect(mockLoadUserData).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the guide open and explains a seeding failure", async () => {
    const user = userEvent.setup();
    mockInsertSelect.mockResolvedValue({
      data: null,
      error: { message: "insert failed" },
    });
    renderWizard();

    await screen.findByRole("dialog", { name: "Welcome to Finance Tracker" });
    await user.click(screen.getByRole("button", { name: "Get started" }));
    await user.click(
      screen.getByRole("button", { name: "Add starter categories" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't add starter categories",
    );
    expect(
      screen.getByRole("heading", { name: "Start with the essentials" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(onboardingStorageKey("user-1"))).toBeNull();
  });

  it("skips setup without seeding anything", async () => {
    const user = userEvent.setup();
    renderWizard();

    await screen.findByRole("dialog", { name: "Welcome to Finance Tracker" });
    await user.click(screen.getByRole("button", { name: "Skip" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(mockInsert).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(onboardingStorageKey("user-1"))).toBe(
      "completed",
    );
  });
});
