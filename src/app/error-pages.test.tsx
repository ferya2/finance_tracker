import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorPage from "./error";
import NotFound from "./not-found";

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

describe("fallback pages", () => {
  it("renders the not-found page with a route home", () => {
    render(<NotFound />);

    expect(screen.getByText("Error 404")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("calls reset from the error page", async () => {
    const reset = vi.fn();
    const user = userEvent.setup();

    render(<ErrorPage error={new Error("boom")} reset={reset} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Error 500")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
