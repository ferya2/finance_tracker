import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/dashboard/command-palette-event";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function renderShortcuts() {
  return render(
    <>
      <KeyboardShortcuts />
      <input aria-label="Note" />
    </>,
  );
}

beforeEach(() => {
  stubMatchMedia(true);
  mockPush.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("KeyboardShortcuts", () => {
  it("opens an animated help dialog listing navigation and action keys", async () => {
    const user = userEvent.setup();
    renderShortcuts();

    await user.click(screen.getByRole("button", { name: "Keyboard shortcuts" }));

    const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveFocus();
    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Transactions")).toBeInTheDocument();
    expect(screen.getAllByText("G").length).toBeGreaterThan(0);
    expect(screen.getAllByText("T").length).toBeGreaterThan(0);
    expect(screen.getByText("Ctrl+K")).toBeInTheDocument();
  });

  it("opens the help dialog with ?", async () => {
    const user = userEvent.setup();
    renderShortcuts();

    await user.keyboard("?");

    expect(
      screen.getByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeInTheDocument();
  });

  it("closes the help dialog with Escape", async () => {
    const user = userEvent.setup();
    renderShortcuts();
    await user.click(screen.getByRole("button", { name: "Keyboard shortcuts" }));

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Keyboard shortcuts" }),
      ).toBeNull(),
    );
  });

  it("navigates with a G-then-letter sequence", async () => {
    const user = userEvent.setup();
    renderShortcuts();

    await user.keyboard("g");
    expect(mockPush).not.toHaveBeenCalled();
    await user.keyboard("t");

    expect(mockPush).toHaveBeenCalledWith("/dashboard/transactions");
  });

  it("drops an incomplete sequence when another key is pressed", async () => {
    const user = userEvent.setup();
    renderShortcuts();

    await user.keyboard("gxt");

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens quick add with n and the palette commands with Ctrl+K", async () => {
    const user = userEvent.setup();
    const handleOpen = vi.fn();
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpen);
    renderShortcuts();

    await user.keyboard("n");
    await user.keyboard("{Control>}k{/Control}");

    expect(handleOpen).toHaveBeenCalledTimes(2);
    expect(handleOpen.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ detail: { mode: "add" } }),
    );
    expect(handleOpen.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ detail: { mode: "commands" } }),
    );
    window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpen);
  });

  it("ignores shortcuts while typing in a form field", async () => {
    const user = userEvent.setup();
    const handleOpen = vi.fn();
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpen);
    renderShortcuts();

    await user.click(screen.getByLabelText("Note"));
    await user.keyboard("gtn?");

    expect(mockPush).not.toHaveBeenCalled();
    expect(handleOpen).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("dialog", { name: "Keyboard shortcuts" }),
    ).toBeNull();
    window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpen);
  });
});
