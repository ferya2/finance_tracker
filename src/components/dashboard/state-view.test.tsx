import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox } from "lucide-react";
import { EmptyState, ErrorState, Skeleton } from "./state-view";

function stubMatchMedia(matches: boolean) {
  const mediaQueryList = {
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mediaQueryList));
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shared state views", () => {
  it("renders skeletons as decorative shimmer blocks", () => {
    const { container } = render(<Skeleton className="h-4 w-24" />);

    const block = container.querySelector("span");
    expect(block).toHaveAttribute("aria-hidden");
    expect(block).toHaveClass("bg-surface-subtle", "h-4", "w-24");
  });

  it("renders an empty state with copy and a working action", async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        icon={Inbox}
        title="Nothing here yet"
        description="Check back later"
        actionLabel="Add one"
        onAction={onAction}
      />,
    );

    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    expect(screen.getByText("Check back later")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add one" }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("renders a compact empty state for tight surfaces", () => {
    const { container } = render(
      <EmptyState compact icon={Inbox} title="All caught up" />,
    );

    expect(screen.getByText("All caught up")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("px-6", "py-8");
  });

  it("leaves the action out when no handler is given", () => {
    render(<EmptyState icon={Inbox} title="All caught up" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("exposes failures as alerts and retries the load", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <ErrorState
        title="Could not load your data"
        message="Network down"
        onRetry={onRetry}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Could not load your data")).toBeInTheDocument();
    expect(within(alert).getByText("Network down")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders every state with reduced motion requested", () => {
    stubMatchMedia(true);

    render(
      <>
        <Skeleton />
        <EmptyState icon={Inbox} title="Nothing here" />
        <ErrorState title="Failed" message="Offline" onRetry={vi.fn()} />
      </>,
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
