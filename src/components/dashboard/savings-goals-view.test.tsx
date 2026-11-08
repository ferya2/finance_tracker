import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SavingsGoalsView } from "./savings-goals-view";
import type { SavingsGoal } from "@/types/goal";

const { mockUseSavingsGoals, mockUseSession, mockSaveSavingsGoals } = vi.hoisted(
  () => ({
    mockUseSavingsGoals: vi.fn(),
    mockUseSession: vi.fn(),
    mockSaveSavingsGoals: vi.fn(),
  }),
);

vi.mock("@/components/use-savings-goals", () => ({
  useSavingsGoals: mockUseSavingsGoals,
}));
vi.mock("@/components/auth/session-provider", () => ({
  useSession: mockUseSession,
}));
vi.mock("@/lib/storage/goals", () => ({
  saveSavingsGoals: mockSaveSavingsGoals,
}));

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

const GOALS: SavingsGoal[] = [
  {
    id: "goal-holiday",
    name: "Holiday",
    savedAmount: 120000,
    targetAmount: 500000,
    targetDate: "2027-06-01",
    color: "#2563eb",
  },
  {
    id: "goal-laptop",
    name: "New laptop",
    savedAmount: 250000,
    targetAmount: 250000,
    color: "#7c3aed",
  },
];

beforeEach(() => {
  stubMatchMedia(true);
  mockUseSavingsGoals.mockReset();
  mockUseSavingsGoals.mockReturnValue(GOALS);
  mockUseSession.mockReset();
  mockUseSession.mockReturnValue({
    status: "authenticated",
    user: { id: "user-1", email: "ada@example.com" },
    signOut: vi.fn(),
  });
  mockSaveSavingsGoals.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SavingsGoalsView", () => {
  it("lists goals with their animated progress and overall total", () => {
    render(<SavingsGoalsView />);

    expect(
      screen.getByRole("heading", { name: "Savings goals" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Holiday")).toBeInTheDocument();
    expect(screen.getByText("New laptop")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "Holiday progress" }),
    ).toHaveAttribute("aria-valuenow", "24");
    expect(
      screen.getByRole("progressbar", { name: "New laptop progress" }),
    ).toHaveAttribute("aria-valuenow", "100");
    expect(
      screen.getByRole("progressbar", { name: "Overall savings progress" }),
    ).toHaveAttribute("aria-valuenow", "49");
    expect(screen.getByText("Goal reached")).toBeInTheDocument();
  });

  it("shows a first-run empty state", () => {
    mockUseSavingsGoals.mockReturnValue([]);

    render(<SavingsGoalsView />);

    expect(screen.getByText("No savings goals yet")).toBeInTheDocument();
  });

  it("creates a goal through the animated form", async () => {
    const user = userEvent.setup();
    mockUseSavingsGoals.mockReturnValue([]);

    render(<SavingsGoalsView />);

    await user.click(screen.getByRole("button", { name: "New goal" }));
    await user.type(screen.getByLabelText("Name"), "Camera");
    await user.type(screen.getByLabelText("Target amount"), "1000");
    await user.type(screen.getByLabelText("Saved so far"), "250");
    await user.click(screen.getByRole("button", { name: "Create goal" }));

    await waitFor(() => expect(mockSaveSavingsGoals).toHaveBeenCalledOnce());
    expect(mockSaveSavingsGoals).toHaveBeenCalledWith("user-1", [
      expect.objectContaining({
        name: "Camera",
        targetAmount: 100000,
        savedAmount: 25000,
      }),
    ]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("edits a goal with its values prefilled", async () => {
    const user = userEvent.setup();

    render(<SavingsGoalsView />);

    await user.click(screen.getByRole("button", { name: "Edit Holiday" }));
    const saved = screen.getByLabelText("Saved so far");
    expect(saved).toHaveValue("1200");
    await user.clear(saved);
    await user.type(saved, "1500");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockSaveSavingsGoals).toHaveBeenCalledOnce());
    expect(mockSaveSavingsGoals).toHaveBeenCalledWith("user-1", [
      expect.objectContaining({ id: "goal-holiday", savedAmount: 150000 }),
      GOALS[1],
    ]);
  });

  it("asks before deleting a goal", async () => {
    const user = userEvent.setup();

    render(<SavingsGoalsView />);

    await user.click(screen.getByRole("button", { name: "Delete Holiday" }));
    expect(
      screen.getByRole("dialog", { name: "Delete this savings goal?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete goal" }));

    await waitFor(() => expect(mockSaveSavingsGoals).toHaveBeenCalledOnce());
    expect(mockSaveSavingsGoals).toHaveBeenCalledWith("user-1", [GOALS[1]]);
  });
});
