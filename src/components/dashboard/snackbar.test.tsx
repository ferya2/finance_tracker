import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Snackbar } from "./snackbar";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

beforeEach(() => {
  stubMatchMedia(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Snackbar", () => {
  it("announces its message politely", () => {
    render(<Snackbar message='Deleted "Rent" · −$1,150.00' onDismiss={vi.fn()} />);

    const snackbar = screen.getByRole("status");
    expect(snackbar).toHaveTextContent('Deleted "Rent" · −$1,150.00');
    expect(snackbar).toHaveAttribute("aria-live", "polite");
  });

  it("shouts about a failure", () => {
    render(
      <Snackbar
        message="Failed to delete transaction"
        tone="danger"
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Failed to delete transaction",
    );
  });

  it("runs its action when undo is pressed", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <Snackbar
        message='Deleted "Rent" · −$1,150.00'
        action={{ label: "Undo", onClick: onAction }}
        onDismiss={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(onAction).toHaveBeenCalledOnce();
  });

  it("says what the action is busy with and waits for it", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <Snackbar
        message='Deleted "Rent" · −$1,150.00'
        action={{ label: "Undo", busyLabel: "Restoring…", busy: true, onClick: onAction }}
        onDismiss={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: /Restoring/ });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onAction).not.toHaveBeenCalled();
  });

  it("dismisses itself once its window is up", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <Snackbar
        message='Deleted "Rent" · −$1,150.00'
        duration={8_000}
        onDismiss={onDismiss}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(7_999);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("holds the countdown while the pointer is on it", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <Snackbar
        message='Deleted "Rent" · −$1,150.00'
        duration={5_000}
        onDismiss={onDismiss}
      />,
    );

    const snackbar = screen.getByRole("status");
    fireEvent.pointerEnter(snackbar);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.pointerLeave(snackbar);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("stays up for good when given no duration", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<Snackbar message="Deleted" duration={0} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("gives a re-rendered parent the full window again", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { rerender } = render(
      <Snackbar message="First" duration={5_000} onDismiss={onDismiss} />,
    );

    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    rerender(<Snackbar message="Second" duration={5_000} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
