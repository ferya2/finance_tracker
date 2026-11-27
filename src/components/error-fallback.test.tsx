import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Home } from "lucide-react";
import { ErrorFallback } from "./error-fallback";

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

describe("ErrorFallback", () => {
  it("renders a missing page with both destinations", () => {
    render(
      <ErrorFallback
        code="404"
        title="This page got lost"
        description="Try another link."
        primary={{ label: "Back to home", href: "/", icon: Home }}
        secondary={{ label: "Go to dashboard", href: "/dashboard" }}
      />,
    );

    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "This page got lost" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Go to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("exposes failures as alerts and retries the failed action", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <ErrorFallback
        code="500"
        title="Something went wrong"
        description="Please try again."
        primary={{ label: "Try again", onClick: onRetry }}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("marks the fallback static when reduced motion is requested", () => {
    stubMatchMedia(true);

    render(
      <ErrorFallback
        code="500"
        title="Something went wrong"
        description="Please try again."
        primary={{ label: "Try again", onClick: vi.fn() }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Something went wrong" })).toBeInTheDocument();
    expect(document.querySelector("[data-reduced-motion='true']")).not.toBeNull();
  });
});
