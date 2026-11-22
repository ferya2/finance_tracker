import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DarkModeToggle,
  getTheme,
  setTheme,
} from "./dark-mode-toggle";

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
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  setTheme("light");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("theme helpers", () => {
  it("applies and reports the chosen theme", () => {
    setTheme("dark");

    expect(getTheme()).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");

    setTheme("light");
    expect(getTheme()).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});

describe("DarkModeToggle", () => {
  it("switches the stored theme when clicked", async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(getTheme()).toBe("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });
});
